import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {Bookmark} from 'lucide-react'
import {api,items} from './api'
import type {Page,Post} from './api'

export function BookmarkButton({postId}:{postId:string}){
 const qc=useQueryClient()
 const q=useQuery({queryKey:['posts','bookmarks'],queryFn:async()=>items<Post>((await api.get<Page<Post>|Post[]>('/posts/bookmarks?pageNumber=1&pageSize=100')).data),retry:false})
 const saved=(q.data??[]).some(p=>p.id===postId)
 const mutation=useMutation({mutationFn:()=>saved?api.delete(`/posts/${postId}/bookmark`):api.post(`/posts/${postId}/bookmark`),onSuccess:async()=>{await Promise.all([qc.invalidateQueries({queryKey:['posts','bookmarks']}),qc.invalidateQueries({queryKey:['feed']})])}})
 return <span className="post-action-wrap"><button type="button" aria-label={saved?'Remove bookmark':'Save post'} aria-pressed={saved} disabled={q.isLoading||mutation.isPending} onClick={()=>mutation.mutate()}><Bookmark size={16} fill={saved?'currentColor':'none'}/>{mutation.isPending?'Saving…':saved?'Saved':'Save'}</button>{mutation.isError&&<small role="alert" className="post-action-feedback">Couldn’t update saved posts. Try again.</small>}</span>
}
