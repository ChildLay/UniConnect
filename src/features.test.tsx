import React from 'react'
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {api,apiErrorMessage,eventRegistrationErrorMessage} from './api'
import {Feed,Discover} from './auth-feed'
import {Connections,Opportunities,MentorSettings,Mentors,Mentoring} from './network-growth'
import {EventDetail,Events} from './community-events'
import {Moderation} from './post-moderation'
import {ConnectionRequestButton} from './connection-actions'

vi.mock('./api',async importOriginal=>{const actual=await importOriginal<typeof import('./api')>();return {...actual,api:{...actual.api,get:vi.fn(),post:vi.fn(),put:vi.fn(),delete:vi.fn()}}})
const paged=(items:any[])=>({items,pageNumber:1,pageSize:20,totalCount:items.length,totalPages:1})
const registerError=(status:number,detail?:string)=>({isAxiosError:true,config:{url:'/events/event-1/register',method:'post'},response:{status,data:detail?{detail}:{}}})
function mount(ui:React.ReactNode,path='/'){const qc=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter></QueryClientProvider>)}
beforeEach(()=>{vi.mocked(api.get).mockReset();vi.mocked(api.post).mockReset();vi.mocked(api.put).mockReset();vi.mocked(api.delete).mockReset()})
afterEach(()=>{cleanup();sessionStorage.clear()})

describe('API feature behavior',()=>{
 it('does not offer a connection request to someone already connected',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:paged(url.startsWith('/connections?')?[{userId:'viewer',connectedUserId:'already-connected'}]:[])} as never));mount(<ConnectionRequestButton recipientId="already-connected"/>);const connected=await screen.findByRole('button',{name:/connected/i});expect(connected).toBeDisabled();fireEvent.click(connected);expect(api.post).not.toHaveBeenCalled()
 })
 it('shows feed posts and lets the user save one',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url.includes('/posts/bookmarks')?[]:url.includes('/profiles/u1')?{userId:'u1',firstName:'Ari',lastName:'Student',universityId:'uni',visibility:0,allowConnectionRequests:true,skills:[],interests:[]}:paged([{id:'post-1',authorId:'u1',authorName:'Ari Student',content:'Building a campus garden',audience:0,allowComments:true,createdAtUtc:'2026-01-01T00:00:00Z',commentCount:0,reactionCount:2}])}) as never)
  mount(<Feed/>);expect(await screen.findByText('Building a campus garden')).toBeInTheDocument();const save=screen.getByRole('button',{name:'Save post'});await waitFor(()=>expect(save).toBeEnabled());fireEvent.click(save);await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/posts/post-1/bookmark'))
 })
 it('lets the post author at any journey stage edit their own post',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url==='/profiles/me'?{userId:'author-1',journeyStage:1}:url==='/profiles/author-1'?{userId:'author-1',firstName:'Ari',lastName:'Student',universityId:'uni',visibility:0,allowConnectionRequests:true,skills:[],interests:[]}:paged([{id:'post-1',authorId:'author-1',authorName:'Ari Student',content:'Old post text',audience:0,allowComments:true,createdAtUtc:'2026-01-01T00:00:00Z',commentCount:0,reactionCount:0}])} as never));vi.mocked(api.put).mockResolvedValue({data:{}} as never);mount(<Feed/>);fireEvent.click(await screen.findByRole('button',{name:'Post options'}));fireEvent.click(screen.getByRole('button',{name:'Edit post'}));const editor=screen.getByRole('textbox',{name:'Edit post content'});expect(editor.closest('.post-edit-panel')).toBeInTheDocument();expect(editor.closest('.post-head')).toBeNull();expect(document.querySelector('.post-content')).toBeNull();fireEvent.change(editor,{target:{value:'Updated post text'}});fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/posts/post-1',{content:'Updated post text',allowComments:true}))
 })
 it('confirms before deleting the author’s own post',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url==='/profiles/me'?{userId:'author-1',journeyStage:2}:url==='/profiles/author-1'?{userId:'author-1',firstName:'Ari',lastName:'Graduate',universityId:'uni',visibility:0,allowConnectionRequests:true,skills:[],interests:[]}:paged([{id:'post-2',authorId:'author-1',authorName:'Ari Graduate',content:'A post to remove',audience:0,allowComments:true,createdAtUtc:'2026-01-01T00:00:00Z',commentCount:0,reactionCount:0}])} as never));vi.mocked(api.delete).mockResolvedValue({data:null} as never);mount(<Feed/>);fireEvent.click(await screen.findByRole('button',{name:'Post options'}));fireEvent.click(screen.getByRole('button',{name:'Delete post'}));expect(await screen.findByRole('alertdialog')).toHaveTextContent('Delete this post?');fireEvent.click(screen.getByRole('button',{name:'Delete post'}));await waitFor(()=>expect(api.delete).toHaveBeenCalledWith('/posts/post-2'))
 })
 it('does not show edit or delete controls on another member’s post',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url==='/profiles/me'?{userId:'viewer-1',journeyStage:1}:url==='/profiles/author-1'?{userId:'author-1',firstName:'Ari',lastName:'Student',universityId:'uni',visibility:0,allowConnectionRequests:true,skills:[],interests:[]}:paged([{id:'post-3',authorId:'author-1',authorName:'Ari Student',content:'Another member’s story',audience:0,allowComments:true,createdAtUtc:'2026-01-01T00:00:00Z',commentCount:0,reactionCount:0}])} as never));mount(<Feed/>);expect(await screen.findByText('Another member’s story')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Post options'})).not.toBeInTheDocument()
 })
 it('prevents an empty post from being submitted',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:paged([])} as never);mount(<Feed/>);fireEvent.click(await screen.findByRole('button',{name:/share post/i}));expect(await screen.findByText('Add a little context before sharing.')).toBeInTheDocument();expect(api.post).not.toHaveBeenCalled()
 })
 it('filters discovery using backend skill and interest parameters',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:paged([{userId:'u2',firstName:'Sam',lastName:'Lee',journeyStage:1,matchScore:3,skills:['Design'],interests:['Design']}])} as never);mount(<Discover/>);expect(await screen.findByText('Sam Lee')).toBeInTheDocument();fireEvent.change(screen.getByRole('textbox',{name:'Filter by skill or interest'}),{target:{value:'Design'}});await waitFor(()=>expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('skill=Design&interest=Design')))
 })
 it('accepts an incoming connection request',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:paged(url.includes('incoming')?[{id:'request-1',senderId:'user-a',recipientId:'user-b',status:0,createdAtUtc:'2026-01-01T00:00:00Z'}]:[])} as never));mount(<Connections/>);fireEvent.click(await screen.findByRole('button',{name:/accept/i}));await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/connections/requests/request-1/accept'))
 })
 it('lets a user withdraw a sent request without showing Block',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url.includes('/requests/outgoing')?paged([{id:'request-2',senderId:'me',recipientId:'recipient-1',status:0,createdAtUtc:'2026-01-01T00:00:00Z'}]):url==='/profiles/recipient-1'?{userId:'recipient-1',firstName:'Jordan',lastName:'Lee',universityId:'uni-1',visibility:0,allowConnectionRequests:true,skills:[],interests:[]}:paged([])} as never));mount(<Connections/>);fireEvent.click(screen.getByRole('button',{name:'Sent requests'}));const withdraw=await screen.findByRole('button',{name:/withdraw request/i});expect(screen.queryByRole('button',{name:/^block$/i})).not.toBeInTheDocument();fireEvent.click(withdraw);await waitFor(()=>expect(api.delete).toHaveBeenCalledWith('/connections/requests/request-2'))
 })
 it('confirms before removing a connection',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url.startsWith('/connections?')?paged([{userId:'me',connectedUserId:'friend-1',connectedAtUtc:'2026-01-01T00:00:00Z'}]):url==='/profiles/friend-1'?{userId:'friend-1',firstName:'Alex',lastName:'Alumni',universityId:'uni-1',visibility:0,allowConnectionRequests:true,skills:[],interests:[]}:paged([])} as never));mount(<Connections/>);fireEvent.click(screen.getByRole('button',{name:'My connections'}));fireEvent.click(await screen.findByRole('button',{name:'Remove connection'}));expect(await screen.findByRole('heading',{name:'Remove Alex Alumni?'})).toBeInTheDocument();const confirm=screen.getAllByRole('button',{name:'Remove connection'}).at(-1)!;fireEvent.click(confirm);await waitFor(()=>expect(api.delete).toHaveBeenCalledWith('/connections/friend-1'))
 })
 it('registers for an event',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:paged([{id:'event-1',title:'Design meetup',hostId:'u1',universityId:'uni',startUtc:'2026-12-01T18:00:00Z',endUtc:'2026-12-01T19:00:00Z',type:1,status:1,registrationCount:1}])} as never);mount(<Events/>);fireEvent.click(await screen.findByRole('button',{name:/i’m in/i}));await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/events/event-1/register'));expect(await screen.findByRole('button',{name:'Registered'})).toBeDisabled()
 })
 it('turns an already-registered conflict into a clear registered state',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:paged([{id:'event-1',title:'Design meetup',hostId:'u1',universityId:'uni',startUtc:'2026-12-01T18:00:00Z',endUtc:'2026-12-01T19:00:00Z',type:1,status:1,registrationCount:1}])} as never);vi.mocked(api.post).mockRejectedValue(registerError(409,'User is already registered.'));mount(<Events/>);fireEvent.click(await screen.findByRole('button',{name:/i’m in/i}));expect(await screen.findByRole('status')).toHaveTextContent('You’re already registered for this event. No need to register again.');expect(screen.getByRole('button',{name:'Registered'})).toBeDisabled()
 })
 it.each([
  [409,'Event capacity has been reached.','This event is full and can’t accept more registrations.'],
  [409,'Event is not open for registration.','Registration for this event is closed.'],
  [409,'Other conflict.','This event’s registration status changed. Refresh the page and try again.'],
  [404,'Event was not found.','This event is no longer available.'],
  [401,'Authentication required.','Your session may have expired. Sign in again, then register for the event.'],
  [403,'Forbidden.','Your account isn’t allowed to register for this event.'],
  [429,'Too many requests.','You’ve tried to register too many times. Wait a moment and try again.'],
  [500,'Unexpected.','The event service couldn’t complete your registration. Please try again shortly.']
 ])('maps event registration API status %i to a helpful message', (status,detail,expected)=>{
  expect(eventRegistrationErrorMessage(registerError(Number(status),String(detail)))).toBe(expected)
 })
 it('uses the API detail for request validation errors',()=>{
  const error=registerError(400,'The request is invalid.')
  expect(eventRegistrationErrorMessage(error)).toBeNull()
  expect(apiErrorMessage(error,'Fallback')).toBe('The request is invalid.')
 })
 it('handles event registration network, generic and unrelated errors safely',()=>{
  expect(apiErrorMessage({isAxiosError:true,config:{url:'/events/event-1/register',method:'post'}} as never,'Fallback')).toContain('couldn’t reach the UniConnect API')
  expect(eventRegistrationErrorMessage({isAxiosError:true,config:{url:'/events/event-1/register',method:'post'},response:{status:408,data:{}}})).toBeNull()
  expect(eventRegistrationErrorMessage({isAxiosError:true,config:{url:'/events/event-1',method:'post'},response:{status:409,data:{detail:'Conflict'}}})).toBeNull()
  expect(apiErrorMessage(new Error('unexpected'),'Fallback')).toBe('Fallback')
 })
 it('shows the already-registered message on the event detail page',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:{id:'event-1',title:'Design meetup',hostId:'u1',universityId:'uni',startUtc:'2026-12-01T18:00:00Z',endUtc:'2026-12-01T19:00:00Z',type:1,status:1,registrationCount:1}} as never);vi.mocked(api.post).mockRejectedValue(registerError(409,'User is already registered.'));mount(<EventDetail/>,'/events/event-1');fireEvent.click(await screen.findByRole('button',{name:'Register'}));expect(await screen.findByRole('status')).toHaveTextContent('You’re already registered for this event. No need to register again.');expect(screen.getByRole('button',{name:'You’re registered'})).toBeDisabled()
 })
 it('sends a mentoring request to an opted-in mentor',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url==='/profiles/me'?{userId:'mentee-1'}:url.startsWith('/mentoring/requests')?paged([]):paged([{userId:'mentor-1',firstName:'Jo',lastName:'Alum',bio:'Product design',capacity:2,isAvailable:true,activeMenteeCount:0}])} as never));mount(<Mentors/>);fireEvent.click(await screen.findByRole('button',{name:/request a conversation/i}));fireEvent.change(screen.getByPlaceholderText('I’m exploring…'),{target:{value:'I would love advice on product design.'}});fireEvent.click(screen.getByRole('button',{name:/send request/i}));await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/mentoring/requests',{mentorId:'mentor-1',message:'I would love advice on product design.'}))
 })
 it('shows an existing active mentoring request and prevents a duplicate',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url==='/profiles/me'?{userId:'mentee-1'}:url.startsWith('/mentoring/requests')?paged([{id:'request-1',mentorId:'mentor-1',menteeId:'mentee-1',message:'Please mentor me',status:0}]):paged([{userId:'mentor-1',firstName:'Jo',lastName:'Alum',bio:'Product design',capacity:2,isAvailable:true,activeMenteeCount:1}])} as never));mount(<Mentors/>);expect(await screen.findByRole('link',{name:/request sent/i})).toBeInTheDocument();expect(screen.queryByRole('button',{name:/request a conversation/i})).not.toBeInTheDocument();expect(api.post).not.toHaveBeenCalled()
 })
 it('hides the signed-in alumnus from mentor browse results',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url==='/profiles/me'?{userId:'alumni-self',journeyStage:3}:url.startsWith('/mentoring/requests')?paged([]):paged([{userId:'alumni-self',firstName:'Alex',lastName:'Alumni',isAvailable:true,activeMenteeCount:0,capacity:3},{userId:'alumni-other',firstName:'Jordan',lastName:'Alumni',bio:'Career coaching',studyArea:'Business',graduationYear:2019,isAvailable:true,activeMenteeCount:0,capacity:2}])} as never));mount(<Mentors/>);expect(await screen.findByRole('heading',{name:'Jordan Alumni'})).toBeInTheDocument();expect(screen.queryByRole('heading',{name:'Alex Alumni'})).not.toBeInTheDocument();expect(screen.getByText('Business · Class of 2019')).toBeInTheDocument();expect(screen.getAllByRole('button',{name:/request a conversation/i})).toHaveLength(1)
 })
 it('shows a useful empty state if only the signed-in user is an available mentor',async()=>{
  vi.mocked(api.get).mockImplementation(async(url:string)=>({data:url==='/profiles/me'?{userId:'alumni-self',journeyStage:3}:url.startsWith('/mentoring/requests')?paged([]):paged([{userId:'alumni-self',firstName:'Alex',lastName:'Alumni',isAvailable:true,activeMenteeCount:0,capacity:3}])} as never));mount(<Mentors/>);expect(await screen.findByText(/no other mentors are available yet/i)).toBeInTheDocument();expect(screen.queryByRole('button',{name:/request a conversation/i})).not.toBeInTheDocument();expect(api.post).not.toHaveBeenCalled()
 })
 it('explains that only Alumni can mentor on the mentoring landing page',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:{userId:'student-1',journeyStage:1}} as never);mount(<Mentoring/>);expect(await screen.findByText(/only alumni can opt in as mentors/i)).toBeInTheDocument();expect(screen.queryByRole('link',{name:'Become a mentor'})).not.toBeInTheDocument();expect(screen.getByRole('link',{name:/browse mentors/i})).toBeInTheDocument()
 })
 it('prevents a non-alumni member from creating a mentor profile',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:{userId:'student-1',journeyStage:1}} as never);mount(<MentorSettings/>);expect(await screen.findByRole('heading',{name:'Mentoring is currently for Alumni'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:/save mentor profile/i})).not.toBeInTheDocument();expect(api.put).not.toHaveBeenCalled()
 })
 it('shows mentor profile setup to an alumnus',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:{userId:'alumni-1',journeyStage:3}} as never);mount(<MentorSettings/>);expect(await screen.findByRole('button',{name:/save mentor profile/i})).toBeInTheDocument()
 })
 it('shows mentor profile save errors in the shared popup',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:{userId:'alumni-1',journeyStage:3}} as never);vi.mocked(api.put).mockRejectedValue(new Error('network'));mount(<MentorSettings/>);fireEvent.change(await screen.findByLabelText('Mentoring areas and experience you can share'),{target:{value:'Career planning and interview practice.'}});fireEvent.submit(screen.getByRole('button',{name:/save mentor profile/i}).closest('form')!);expect(await screen.findByRole('alert')).toHaveTextContent('Your mentor profile couldn’t be saved. Please try again.');expect(screen.getByRole('alert')).toHaveClass('event-toast','error')
 })
 it('shows mentor profile save success in the shared popup',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:{userId:'alumni-1',journeyStage:3}} as never);vi.mocked(api.put).mockResolvedValue({data:{}} as never);mount(<MentorSettings/>);fireEvent.change(await screen.findByLabelText('Mentoring areas and experience you can share'),{target:{value:'Career planning and interview practice.'}});fireEvent.submit(screen.getByRole('button',{name:/save mentor profile/i}).closest('form')!);await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/mentoring/profile',{bio:'Career planning and interview practice.',capacity:3,isAvailable:true}));expect(await screen.findByRole('status')).toHaveTextContent('Your mentor profile was saved.');expect(screen.getByRole('status')).toHaveClass('event-toast','success')
 })
 it('saves an opportunity',async()=>{
  vi.mocked(api.get).mockResolvedValue({data:paged([{id:'opp-1',title:'Graduate designer',description:'A design role',creatorId:'u1',universityId:'uni',type:1,createdAtUtc:'2026-01-01T00:00:00Z'}])} as never);mount(<Opportunities/>);fireEvent.click(await screen.findByRole('button',{name:'Save opportunity'}));await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/opportunities/opp-1/save'))
 })
 it('keeps moderation unavailable to a normal user',()=>{sessionStorage.setItem('uniconnect.session',JSON.stringify({accessToken:`x.${btoa(JSON.stringify({role:'User'}))}.x`}));mount(<Moderation/>);expect(screen.getByRole('heading',{name:'Moderators only'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Reports'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'User access'})).not.toBeInTheDocument();expect(api.get).not.toHaveBeenCalled()})
 it('shows the report queue to an admin',async()=>{sessionStorage.setItem('uniconnect.session',JSON.stringify({accessToken:`x.${btoa(JSON.stringify({'http://schemas.microsoft.com/ws/2008/06/identity/claims/role':'Admin'}))}.x`}));vi.mocked(api.get).mockResolvedValue({data:paged([{id:'r-1',targetType:'Post',targetId:'p-1',reason:'Spam',status:0,createdAtUtc:'2026-01-01T00:00:00Z'}])} as never);mount(<Moderation/>);expect(await screen.findByText('Post · Spam')).toBeInTheDocument()})
})
import {Login} from './auth-feed'
import App from './App'
import {ProfilePage,ProfileSettings} from './profile-settings'

describe('authentication and profiles',()=>{
 const profile={userId:'user-1',firstName:'Ari',lastName:'Student',universityId:'uni-1',headline:'Curious designer',bio:'Learning by making.',programme:'BDes',studyArea:'Design',visibility:0,allowConnectionRequests:true,skills:['Research'],interests:['Community'],graduationYear:2027}
 it('shows a clear login error when the backend rejects credentials',async()=>{
  vi.mocked(api.post).mockRejectedValue(new Error('unauthorized'));mount(<Login/>);fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'ari@example.edu'}});fireEvent.change(screen.getByLabelText('Password'),{target:{value:'incorrect'}});fireEvent.submit(screen.getByRole('button',{name:/sign in/i}).closest('form')!);expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t sign you in.');
 })
 it('routes an unauthenticated visitor to the login screen',async()=>{sessionStorage.clear();mount(<App/>,'/feed');expect(await screen.findByRole('heading',{name:'Welcome back'})).toBeInTheDocument()})
 it('shows Moderation in the sidebar for an admin role claim from the API',async()=>{sessionStorage.setItem('uniconnect.session',JSON.stringify({accessToken:`x.${btoa(JSON.stringify({'http://schemas.microsoft.com/ws/2008/06/identity/claims/role':'Admin'}))}.x`}));vi.mocked(api.get).mockResolvedValue({data:profile} as never);mount(<App/>,'/settings');expect(await screen.findByRole('link',{name:'Moderation'})).toHaveAttribute('href','/admin/moderation')})
 it('keeps Moderation out of the sidebar for regular users',async()=>{sessionStorage.setItem('uniconnect.session',JSON.stringify({accessToken:`x.${btoa(JSON.stringify({role:'User'}))}.x`}));vi.mocked(api.get).mockResolvedValue({data:profile} as never);mount(<App/>,'/settings');expect(await screen.findByRole('heading',{name:'Settings'})).toBeInTheDocument();expect(screen.queryByRole('link',{name:'Moderation'})).not.toBeInTheDocument()})
 it('displays the profile returned by the API',async()=>{vi.mocked(api.get).mockResolvedValue({data:profile} as never);mount(<ProfilePage/>,'/profile/ari-student/user-1');expect(await screen.findByRole('heading',{name:'Ari Student',level:1})).toBeInTheDocument();expect(await screen.findByText('Learning by making.')).toBeInTheDocument()})
 it('saves profile edits using the profile DTO fields',async()=>{vi.mocked(api.get).mockResolvedValue({data:profile} as never);vi.mocked(api.put).mockResolvedValue({data:profile} as never);mount(<ProfileSettings/>,'/settings/profile');fireEvent.change(await screen.findByLabelText('Headline'),{target:{value:'Product designer'}});fireEvent.click(screen.getByRole('button',{name:/save profile/i}));await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/profiles/me',expect.objectContaining({headline:'Product designer',visibility:0,allowConnectionRequests:true})))})
})

