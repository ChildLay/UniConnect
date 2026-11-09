import {describe,it,expect,vi,beforeEach} from 'vitest'
import {fireEvent,render,screen,waitFor} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {PostComments} from './post-comments'
import {api} from './api'

vi.mock('./api',async importOriginal=>{const actual=await importOriginal<typeof import('./api')>();return {...actual,api:{...actual.api,get:vi.fn(),post:vi.fn(),put:vi.fn(),delete:vi.fn()}}})

const profile={userId:'student-1',firstName:'Sam',lastName:'Student',universityId:'uni-1',visibility:0,allowConnectionRequests:true,skills:[],interests:[]}
const comment={id:'comment-1',postId:'post-1',authorId:'student-2',authorName:'Alex Alumni',authorProfileImageUrl:null,content:'Kia ora, welcome!',createdAtUtc:'2026-11-08T10:00:00Z'}
function renderThread(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});return render(<QueryClientProvider client={client}><PostComments postId="post-1" commentCount={1}/></QueryClientProvider>)}

describe('post comments',()=>{
 beforeEach(()=>{vi.mocked(api.get).mockImplementation(async url=>({data:String(url).includes('/profiles/me')?profile:{items:[comment],pageNumber:1,pageSize:10,totalCount:1,totalPages:1}}) as never)})
 it('loads and displays existing comments with their author',async()=>{renderThread();expect(await screen.findByText('Kia ora, welcome!')).toBeInTheDocument();expect(screen.getByText('Alex Alumni')).toBeInTheDocument();expect(screen.queryByText(/earlier comments aren’t included/i)).not.toBeInTheDocument()})
 it('submits a new comment',async()=>{vi.mocked(api.post).mockResolvedValue({data:{...comment,id:'comment-2'}} as never);renderThread();const input=screen.getByRole('textbox',{name:'Write a comment'});fireEvent.change(input,{target:{value:'Thanks!'}});fireEvent.click(screen.getByRole('button',{name:'Post comment'}));await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/posts/post-1/comments',{content:'Thanks!'}))})
})
