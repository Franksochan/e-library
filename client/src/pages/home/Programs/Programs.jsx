import React, { useEffect, useState } from 'react'
import useUserData from '../../../../hooks/useUserData'
import usePrivateApi from '../../../../hooks/usePrivateApi'
import ProgramSearch from './ProgramSearch'
import { useNavigate } from 'react-router-dom'
import RecommendedProgram from './RecommendedProgram'
import ProgramCard from './ProgramCard'
import FloatingButton from '../../../components/FloatingButton/FloatingButton'
import Form from '../../../components/UploadForm/Form'

export const Programs = () => {
  const { user } = useUserData()
  const privateAxios = usePrivateApi()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ recommendedProgram: null, programs: [] })
  const userID = localStorage.getItem("userID")
  const userRole = localStorage.getItem('userRole')

  useEffect(() => {
    console.log(userID)
    console.log(user.role)
    const fetchPrograms = async () => {
      setLoading(true)
      try {
        let response
        if (user.role === 'Student') {
          response = await privateAxios.get(`/users/${userID}/programs`, user.role, { withCredentials: true })
        } else if (user.role === 'Staff' || user.role === 'Librarian') {
          response = await privateAxios.get(`/programs/get-programs`, { params: { role: user.role } })
        }
        setData({ recommendedProgram: response?.data?.response?.recommendedPrograms || null, programs: response?.data?.response?.restOfPrograms || [] })
        console.log(data)
      } catch (err) {
        console.log(err)
        if (err.response && err.response.status === 401) {
          console.log('Token expired. Navigating to /auth')
          navigate('/auth')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [user, user._id, privateAxios, navigate])

  const navigateToCourses = (programID) => {
    navigate(`/courses/${programID}`)
  }

  const navigateToForm = () => {
    navigate(`/form/program/null`)
  }

  useEffect(() => {
    const filteredResults = data.programs.filter((program) => program.title.toLowerCase().includes(searchQuery.toLowerCase()))
    setSearchResults(filteredResults)
  }, [searchQuery, data.programs])

  const handleResultClick = (result) => {
    setSearchQuery(result.title)
    setSearchResults([])
    navigateToCourses(result._id)
  }

  const openForm = () => {
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
  }

  return (
    <div className={`programs`}>
      <ProgramSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        handleResultClick={handleResultClick}
      />
      {!loading && data.recommendedProgram && (
        <>
          <h2>Recommended</h2>
          <RecommendedProgram
            program={data.recommendedProgram}
            onClick={() => navigateToCourses(data.recommendedProgram._id)}
          />
        </>
      )}
      {!loading && data.recommendedProgram && <h2>Others</h2>}
      <div className="other-programs">
        {data.programs.map((program) => (
          <ProgramCard
            key={program._id}
            program={program}
            onClick={() => navigateToCourses(program._id)}
          />
        ))}
      </div>
      { userRole=== 'Student' && <FloatingButton onClick={openForm} /> }
      {showForm && <Form onClose={closeForm} type="program" programID={null} />}
    </div>
  )
}

