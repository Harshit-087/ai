import React from 'react'
import { Route, Router,Routes } from 'react-router-dom'
// import ResumeClassifier from './components/user.jsx'
// import ResumeDashboard from './components/admin'
import Dashboard from './components/dashboard.jsx'
import HomePage from './components/homepage.jsx'
// import ResumeScreenerUI from './components/hello.jsx'

const App = () => {

  return (
    <div>
     
        <Routes>
          <Route path = "/"  element={<HomePage/>}/>
          <Route path="/admin" element={<Dashboard/>}/>
          {/* <Route path="/Filter" element={<ResumeScreenerUI/>}/> */}
         </Routes>
     
    </div>
  )
}

export default App