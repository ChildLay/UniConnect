import {describe,it,expect,vi} from 'vitest'
import {fireEvent,render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {Login} from './auth-feed'
import {api} from './api'
vi.mock('./api',async importOriginal=>{const actual=await importOriginal<typeof import('./api')>();return {...actual,api:{...actual.api,post:vi.fn()}}})

describe('login',()=>{
 it('shows a helpful validation message before calling the API',async()=>{
  render(<MemoryRouter><Login/></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'not-an-email'}})
  fireEvent.change(screen.getByLabelText('Password'),{target:{value:'secret'}})
  fireEvent.submit(screen.getByRole('button',{name:/sign in/i}).closest('form')!)
  expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.')
  expect(api.post).not.toHaveBeenCalled()
 })
})


