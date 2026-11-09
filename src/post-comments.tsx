import {useState} from 'react'
import {useInfiniteQuery,useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {ArrowRight,Check,LoaderCircle,X} from 'lucide-react'
import {api,apiErrorMessage} from './api'
import type {Comment,Page,Profile} from './api'
import {Avatar} from './shared'

export function PostComments({postId,commentCount,allowComments=true,enabled=true}:{postId:string;commentCount:number;allowComments?:boolean;enabled?:boolean}){
 const [text,setText]=useState(''),[editingId,setEditingId]=useState<string|null>(null),[editText,setEditText]=useState(''),[confirmDelete,setConfirmDelete]=useState<string|null>(null),qc=useQueryClient()
 const own=useQuery({queryKey:['profile','me'],queryFn:async()=> (await api.get<Profile>('/profiles/me')).data,enabled,retry:false})
 const query=useInfiniteQuery({queryKey:['post',postId,'comments'],queryFn:async({pageParam})=>(await api.get<Page<Comment>>(`/posts/${postId}/comments?pageNumber=${pageParam}&pageSize=10`)).data,initialPageParam:1,getNextPageParam:last=>last.pageNumber<last.totalPages?last.pageNumber+1:undefined,enabled,retry:false})
 const comments=query.data?.pages.flatMap(page=>page.items)??[]
 const refresh=()=>{qc.invalidateQueries({queryKey:['post',postId,'comments']});qc.invalidateQueries({queryKey:['feed']});qc.invalidateQueries({queryKey:['post',postId]})}
 const add=useMutation({mutationFn:async()=> (await api.post<Comment>(`/posts/${postId}/comments`,{content:text.trim()})).data,onSuccess:()=>{setText('');refresh()}})
 const edit=useMutation({mutationFn:async()=>{if(!editingId)throw new Error('Choose a comment to edit.');return (await api.put<Comment>(`/comments/${editingId}`,{content:editText.trim()})).data},onSuccess:()=>{setEditingId(null);setEditText('');refresh()}})
 const remove=useMutation({mutationFn:async(id:string)=>api.delete(`/comments/${id}`),onSuccess:()=>{setConfirmDelete(null);refresh()}})
 return <section className="social-comments" aria-label="Post comments">
  {query.isLoading&&<div className="comments-loading"><LoaderCircle className="spin" size={16}/> Loading comments…</div>}
  {query.isError&&<div className="comments-error" role="alert">{apiErrorMessage(query.error,'Comments couldn’t be loaded. Please try again.')} <button type="button" onClick={()=>query.refetch()}>Try again</button></div>}
  {query.isSuccess&&comments.length===0&&<p className="comments-empty">No comments yet. Start the conversation.</p>}
  {comments.map(comment=><article className="social-comment" key={comment.id}>
   <Avatar name={comment.authorName??'Community member'} imageUrl={comment.authorProfileImageUrl}/>
   <div className="social-comment-main">
    <div className="comment-bubble"><div className="comment-author-line"><b>{comment.authorName??'Community member'}</b><time dateTime={comment.createdAtUtc}>{new Date(comment.createdAtUtc).toLocaleString()}</time></div>
     {editingId===comment.id?<form className="comment-edit-form" onSubmit={e=>{e.preventDefault();if(editText.trim())edit.mutate()}}><textarea autoFocus maxLength={4000} value={editText} onChange={e=>setEditText(e.target.value)} aria-label="Edit your comment"/><div><button className="quiet-button small" type="button" onClick={()=>{setEditingId(null);setEditText('')}}><X size={13}/> Cancel</button><button className="primary-button small" disabled={!editText.trim()||edit.isPending}><Check size={13}/> Save</button></div></form>:<p>{comment.content}</p>}
    </div>
    {own.data?.userId===comment.authorId&&editingId!==comment.id&&<div className="comment-tools">{confirmDelete===comment.id?<><span>Delete this comment?</span><button type="button" className="comment-text-button danger-text" disabled={remove.isPending} onClick={()=>remove.mutate(comment.id)}>Delete</button><button type="button" className="comment-text-button" onClick={()=>setConfirmDelete(null)}>Cancel</button></>:<><button type="button" className="comment-text-button" onClick={()=>{setEditingId(comment.id);setEditText(comment.content)}}>Edit</button><button type="button" className="comment-text-button" onClick={()=>setConfirmDelete(comment.id)}>Delete</button></>}</div>}
   </div>
  </article>)}
  {query.hasNextPage&&<button className="load-comments" type="button" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?<><LoaderCircle className="spin" size={14}/> Loading…</>:`View earlier comments (${Math.max(0,commentCount-comments.length)} more)`}</button>}
  {allowComments&&<form className="comment-inline social-comment-form" onSubmit={e=>{e.preventDefault();if(text.trim())add.mutate()}}><Avatar className="comment-composer-avatar" name={own.data?`${own.data.firstName} ${own.data.lastName}`:'You'} imageUrl={own.data?.profileImageUrl}/><div className="comment-composer-input"><textarea maxLength={4000} value={text} onChange={e=>setText(e.target.value)} placeholder="Write a comment…" aria-label="Write a comment"/><div className="comment-composer-footer"><span>{text.length>0?`${text.length}/4000`:''}</span><button aria-label="Post comment" disabled={!text.trim()||add.isPending}>{add.isPending?<LoaderCircle className="spin" size={16}/>:<ArrowRight size={16}/>}</button></div></div>{add.isError&&<span className="form-error" role="alert">Your comment couldn’t be posted. Please try again.</span>}</form>}
 </section>
}
