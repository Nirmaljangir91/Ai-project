import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useEffect } from 'react'
import axios from 'axios'


function App() {
  const [count, setCount] = useState({})

  useEffect(() => {
    axios.get(' http://localhost:5000/api/test')
    .then((response) => {
      console.log(response)
      setCount(response.data)
    })
    .catch((error) =>{
      console.log(error)
    })
  }, [])

  return (
    <>
    <h1>your data</h1>
    <h1>{JSON.stringify(count)}</h1>
    </>
  )
}

export default App
