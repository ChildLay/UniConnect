import {useEffect,useRef,useState} from 'react'
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {MoreHorizontal,Pencil,Trash2} from 'lucide-react'
import {api,apiErrorMessage} from './api'
import type {Post,Profile} from './api'
import {ToastMessage} from './shared'

export function PostOwnerActions({post,onEdit,onDeleted}:{post:Post;onEdit:()=>void;onDeleted?:()=>void}){
 const qc=useQueryClient(),me=useQuery({queryKey:['profile','me'],queryFn:async()=> (await api.get<Profile>('/profiles/me')).data,retry:false}),[confirming,setConfirming]=useState(false),[menuOpen,setMenuOpen]=useState(false),[toast,setToast]=useState<{message:string;tone:'success'|'error'}|null>(null),menuRef=useRef<HTMLDivElement>(null),triggerRef=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(!menuOpen)return;const outside=(event:PointerEvent)=>{if(!menuRef.current?.contains(event.target as Node))setMenuOpen(false)},key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenuOpen(false);triggerRef.current?.focus()}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key)}},[menuOpen])
const refresh=async()=>{
  await Promise.all([
   qc.invalidateQueries({queryKey:['feed']}),
   qc.invalidateQueries({queryKey:['posts']}),
   qc.invalidateQueries({queryKey:['post',post.id]})
  ])
 }
 const remove=useMutation({mutationFn:()=>api.delete(`/posts/${post.id}`),onSuccess:async()=>{setConfirming(false);setToast({message:'Your post was deleted.',tone:'success'});await refresh();onDeleted?.()},onError:error=>setToast({message:apiErrorMessage(error,'Your post couldn’t be deleted. Please try again.'),tone:'error'})})
 if(me.data?.userId!==post.authorId)return null
 return <>
  <div className="post-owner-actions" ref={menuRef}>
   <button ref={triggerRef} type="button" className="post-owner-trigger" aria-label="Post options" aria-expanded={menuOpen} aria-controls={`post-options-${post.id}`} onClick={()=>setMenuOpen(value=>!value)}><MoreHorizontal size={21}/></button>
   {menuOpen&&<div className="post-owner-menu" id={`post-options-${post.id}`}><button type="button" onClick={()=>{setMenuOpen(false);onEdit()}}><Pencil size={15}/> Edit post</button><button type="button" className="post-delete-trigger" onClick={()=>{setMenuOpen(false);setConfirming(true)}}><Trash2 size={15}/> Delete post</button></div>}
  </div>
  {toast&&<ToastMessage message={toast.message} tone={toast.tone} onClose={()=>setToast(null)}/>}
  {confirming&&<div className="modal-backdrop" role="presentation" onClick={()=>!remove.isPending&&setConfirming(false)}><section className="modal" role="alertdialog" aria-modal="true" aria-labelledby={`delete-post-title-${post.id}`} aria-describedby={`delete-post-description-${post.id}`} onClick={e=>e.stopPropagation()}><span className="eyebrow">POST SETTINGS</span><h2 id={`delete-post-title-${post.id}`}>Delete this post?</h2><p id={`delete-post-description-${post.id}`}>This post will be removed from the community feed. You can’t undo this action.</p><div className="photo-actions"><button type="button" className="quiet-button" disabled={remove.isPending} onClick={()=>setConfirming(false)}>Cancel</button><button type="button" className="primary-button" disabled={remove.isPending} onClick={()=>remove.mutate()}>{remove.isPending?'Deleting…':'Delete post'}</button></div></section></div>}
 </>
}

export function PostEditForm({post,onCancel,onSaved}:{post:Post;onCancel:()=>void;onSaved:()=>void}){
 const qc=useQueryClient(),[content,setContent]=useState(post.content),[allowComments,setAllowComments]=useState(post.allowComments),[toast,setToast]=useState<{message:string;tone:'success'|'error'}|null>(null)
 const save=useMutation({mutationFn:()=>api.put<Post>(`/posts/${post.id}`,{content:content.trim(),allowComments}),onSuccess:async()=>{await Promise.all([qc.invalidateQueries({queryKey:['feed']}),qc.invalidateQueries({queryKey:['posts']}),qc.invalidateQueries({queryKey:['post',post.id]})]);onSaved()},onError:error=>setToast({message:apiErrorMessage(error,'Your post couldn’t be updated. Please try again.'),tone:'error'})})
 return <form className="post-edit-panel" onSubmit={e=>{e.preventDefault();if(content.trim())save.mutate()}}>
  <label>Edit your post<textarea aria-label="Edit post content" maxLength={5000} required value={content} onChange={e=>setContent(e.target.value)}/></label>
  <label className="check-row"><input type="checkbox" checked={allowComments} onChange={e=>setAllowComments(e.target.checked)}/><span>Allow comments</span></label>
  {toast&&<ToastMessage message={toast.message} tone={toast.tone} onClose={()=>setToast(null)}/>}
  <div className="post-edit-actions"><button type="button" className="quiet-button" disabled={save.isPending} onClick={onCancel}>Cancel</button><button className="primary-button small" disabled={!content.trim()||save.isPending}>{save.isPending?'Saving…':'Save changes'}</button></div>
 </form>
}