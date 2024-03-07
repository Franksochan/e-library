import { useEffect, useState } from "react"
import useUserData from "../../../hooks/useUserData"
import { useCookies } from "react-cookie"
import api from "../../../utils/api"

export const Programs = () => {
  const userID = localStorage.getItem("userID")
  const [ recommendedPrograms, setRecommendedPrograms ] = useState([])
  const [ programs, setPrograms ] = useState([])
  const { user } = useUserData()
  const [cookies] = useCookies(["access_token"])
  const access_token = cookies.access_token
  
  useEffect(() => {
    const fetchPrograms = async () => {
      try {

        const config = {
          headers: {
            Authorization: `Bearer ${access_token}`, 
          },
        }
        if (user.role === 'Student') {
          const response = await api.get(`/users/${userID}/programs`, config, user.role)
          console.log({response})

          setPrograms(response.data.response.restOfPrograms)
          setRecommendedPrograms(response.data.response.recommendedPrograms)
        } else if (user.role === 'Staff') {
          const response = await api.get(`/programs/get-programs`, config)
          setPrograms(response.data.response.programs)
        }
      } catch (err) {
        console.log(err)
      }
    }
    fetchPrograms()
    console.log('NAGRERENDER')
  }, [user])

  return (
    <div className="programs">
      { recommendedPrograms.length > 0 &&
        <>
          <h2>Recommended</h2>
          <div className="recommended-programs">
          { recommendedPrograms.map((program) => (
            <div className="program-card" key={program._id}>
              <div className="book-img-div">
                <img className='book-img' src='book.png' alt="books" /> 
              </div>
              <div className="program-details">
                <p className="program-title"><strong>{program.title}</strong></p>
                <p>{program.description}</p>
              </div>
            </div>
          ))}
          </div> 
        </>
      }
      { recommendedPrograms.length > 0 && <h2>Others</h2> }
      <div className="other-programs">
      { programs.map((program) => (
        <div className="program-card" key={program._id}>
          <div className="book-img-div">
            <img className='book-img' src='book.png' alt="books" /> 
          </div>
          <div className="program-details">
            <h1 className="program-title">{program.title}</h1>
            <p>{program.description}</p>
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}