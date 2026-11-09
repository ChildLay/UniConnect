import {useState} from 'react'
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {Check,Plus,Shield} from 'lucide-react'
import {Link} from 'react-router-dom'
import {api,apiErrorMessage} from './api'
import type {Page} from './api'
import {rememberBlockedUser} from './image-utils'

type Connection={userId:string;connectedUserId:string}
type Request={senderId:string;recipientId:string}
async function getEveryPage<T>(path:string){const first=(await api.get<Page<T>>(`${path}?pageNumber=1&pageSize=100`)).data;const remaining=await Promise.all(Array.from({length:Math.max(0,first.totalPages-1)},(_,index)=>api.get<Page<T>>(`${path}?pageNumber=${index+2}&pageSize=100`).then(r=>r.data.items)));return [...first.items,...remaining.flat()]}

export function ConnectionRequestButton({recipientId}:{recipientId:string}){
 const qc=useQueryClient(),state=useQuery({queryKey:['connections','relationship-state'],queryFn:async()=>{const[connections,outgoing,incoming]=await Promise.all([getEveryPage<Connection>('/connections'),getEveryPage<Request>('/connections/requests/outgoing'),getEveryPage<Request>('/connections/requests/incoming')]);return{connections,outgoing,incoming}},retry:false})
 const connected=state.data?.connections.some(c=>(c.userId===recipientId)||(c.connectedUserId===recipientId)),sent=state.data?.outgoing.some(r=>r.recipientId===recipientId),received=state.data?.incoming.some(r=>r.senderId===recipientId)
 const send=useMutation({mutationFn:()=>api.post('/connections/requests',{recipientId}),onSuccess:async()=>{await Promise.all([qc.invalidateQueries({queryKey:['connections']}),qc.invalidateQueries({queryKey:['discovery']})])}})
 return <span className="action-with-feedback">{state.isError?<button type="button" className="quiet-button small" onClick={()=>state.refetch()}>Retry status check</button>:<button type="button" className={`${connected||sent?'quiet-button':'primary-button'} small`} disabled={state.isLoading||connected||sent||received||send.isPending} onClick={()=>send.mutate()}>{state.isLoading?'Checking…':connected?<><Check size={14}/> Connected</>:sent?'Request sent':received?'Request received':send.isPending?'Sending…':<><Plus size={14}/> Connect</>}</button>}{received&&!connected&&!sent&&!state.isLoading&&!state.isError&&<Link className="quiet-button small" to="/connections">Respond to request</Link>}{send.isError&&<small role="alert">{apiErrorMessage(send.error,'Couldn’t send the request. Try again.')}</small>}</span>
}

export function BlockUserButton({userId,name,className='quiet-button'}:{userId:string;name:string;className?:string}){
 const[open,setOpen]=useState(false),qc=useQueryClient()
 const block=useMutation({mutationFn:()=>api.post(`/connections/block/${userId}`),onSuccess:async()=>{rememberBlockedUser(userId,name);setOpen(false);await Promise.all([qc.invalidateQueries({queryKey:['connections','blocked']}),qc.invalidateQueries({queryKey:['blocked']}),qc.invalidateQueries({queryKey:['discovery']})])}})
 return <><button type="button" className={className} onClick={()=>setOpen(true)}><Shield size={14}/> Block</button>{open&&<div className="modal-backdrop" role="presentation" onClick={()=>setOpen(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="block-title" onClick={e=>e.stopPropagation()}><span className="eyebrow">CONNECTION PREFERENCES</span><h2 id="block-title">Block {name}?</h2><p>They won’t be able to connect with you, and you won’t see each other in discovery.</p>{block.isError&&<div role="alert" className="form-error">{apiErrorMessage(block.error,'Couldn’t block this member. Try again.')}</div>}<div className="photo-actions"><button className="quiet-button" onClick={()=>setOpen(false)}>Cancel</button><button className="primary-button" disabled={block.isPending} onClick={()=>block.mutate()}>{block.isPending?'Blocking…':'Block member'}</button></div></section></div>}</>
}

export function RemoveConnectionButton({userId,name,className='quiet-button'}:{userId:string;name:string;className?:string}){
 const[open,setOpen]=useState(false),qc=useQueryClient()
 const remove=useMutation({mutationFn:()=>api.delete(`/connections/${userId}`),onSuccess:async()=>{await Promise.all([qc.invalidateQueries({queryKey:['connections']}),qc.invalidateQueries({queryKey:['discovery']})]);setOpen(false)}})
 return <><button type="button" className={className} onClick={()=>setOpen(true)}>Remove connection</button>{open&&<div className="modal-backdrop" role="presentation" onClick={()=>!remove.isPending&&setOpen(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="remove-connection-title" onClick={e=>e.stopPropagation()}><span className="eyebrow">YOUR CONNECTIONS</span><h2 id="remove-connection-title">Remove {name}?</h2><p>They’ll be removed from your connections. You can send a new request later.</p>{remove.isError&&<div role="alert" className="form-error">{apiErrorMessage(remove.error,'This connection couldn’t be removed. Please try again.')}</div>}<div className="photo-actions"><button type="button" className="quiet-button" disabled={remove.isPending} onClick={()=>setOpen(false)}>Cancel</button><button type="button" className="primary-button" disabled={remove.isPending} onClick={()=>remove.mutate()}>{remove.isPending?'Removing…':'Remove connection'}</button></div></section></div>}</>
}
