import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { privateAxios } from "../../../utils/api"
import api from "../../../utils/api"
import { ProfileSection } from "../../components/ProfileSection/ProfileSection"
import FloatingButton from "../../components/FloatingButton/FloatingButton"
import Form from "../../components/UploadForm/Form"
import Logo from "../../../public/pu-logo-2.png"
import './courses.css'

const Courses = () => {
  const [programCourses, setProgramCourses] = useState([])
  const [ programImage, setProgramImage ] = useState(null)
  const [ showProfileSection, setShowProfileSection ] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { programID } = useParams()
  const userID = localStorage.getItem("userID")
  const userRole = localStorage.getItem("userRole")
  const navigate = useNavigate()

  useEffect(() => {
    console.log('courses loaded')
    let isMounted = true;

    const fetchProgramCourses = async () => {
      try {
        const response = await privateAxios.get(`/courses/${programID}/courses/${userID}`)
        setProgramCourses(response.data.courses)
      } catch (err) {
        if (err.response) {
          alert(err.response)
        }
      }
    }

    fetchProgramCourses()
    fetchProgramImage()

    return () => {
      isMounted = false
    }
  }, [programID])

  const fetchProgramImage = async () => {
    try {
      const response = await api.get(`/programs/get-image/${programID}/${userID}`)
      console.log(response)
      setProgramImage(response.data.downloadUrl)
    } catch (err) {
      console.log(console.error())
    }
  }

  const navigateToHome = () => {
    navigate('/')
  }

  const navigateToLearningMaterials = (courseID) => {
    navigate(`/learning-materials/${courseID}/${programID}`)
  }

  const openForm = () => {
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
  }

  return (
    <div className="courses-div">
      <header>
        <ProfileSection 
          showProfileSection = {showProfileSection}
          setShowProfileSection = {setShowProfileSection}
        />
        <div className="header-content">
          <ion-icon name="arrow-back" onClick={() => navigateToHome()}></ion-icon>
          <h1>Courses</h1>
        </div> 
        <dotlottie-player src="https://lottie.host/c7b8849d-1b44-4cb0-a68f-6874fbafe0f3/AJYxlq4Zs0.json" background="transparent" speed="1" style={{ width: "110px", height: "auto", margin: "10px" }} loop autoplay></dotlottie-player>
      </header>
      <main>
        { programCourses.length === 0 ? (
          <p>No courses found.</p> 
        ) : (
          <div className="courses">
            {programCourses.map((course) => (
              <div className="course-card" key={course._id} onClick={() => navigateToLearningMaterials(course._id)} >
                { programImage !== null ? (
                 <div className="image-container">
                  <img className="course-img" src={programImage} alt="program image" />
                    <p className="attribution-text">
                      Free resources from <a href="https://free3dicon.com/" target="_blank" rel="noopener noreferrer">free3dicon.com</a>
                    </p>
                  </div>
                  ) : (
                    <img className="course-img" src={Logo} alt="pu-logo"/>
                  ) 
                }                   
                <p className="course-title">{course.title}</p>
              </div>
            ))}
          </div>
        )
        }
      </main>
      { userRole=== 'Student' && <FloatingButton onClick={openForm} /> }
      {showForm && <Form onClose={closeForm} type="course" programID={programID} />}
    </div>
  )
}

export default Courses
