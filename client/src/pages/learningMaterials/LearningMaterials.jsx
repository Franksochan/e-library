import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ProfileSection } from "../../components/ProfileSection/ProfileSection"
import api from "../../../utils/api"
import "./LearningMaterials.css"

const LearningMaterials = () => {
  const [learningMaterials, setLearningMaterials] = useState([])
  const [ showProfileSection, setShowProfileSection ] = useState(false)
  const userID = localStorage.getItem("userID")
  const { courseID, programID } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLearningMaterials = async () => {
      try {
        const response = await api.get(`/learning-materials/courses/${courseID}/${userID}`)
        setLearningMaterials(response.data.learningMaterials)
        console.log(learningMaterials)
      } catch (err) {
        console.log(err)
      }
    }

    fetchLearningMaterials()
  }, [courseID])

  const navigateBackToCourses = () => {
    navigate(`/courses/${programID}`)
  }

  const handlePdfClick = (materialID) => {
    navigate(`/view-material/${materialID}`)
  }

  return (
    <div className="learning-materials-container"> 
      <header>
        <ProfileSection 
            showProfileSection = {showProfileSection}
            setShowProfileSection = {setShowProfileSection}
          />
        <div className="header-content">
          <ion-icon name="arrow-back" onClick={() => navigateBackToCourses()}></ion-icon>
          <h1>Learning Materials</h1>
        </div> 
        <dotlottie-player src="https://lottie.host/c7b8849d-1b44-4cb0-a68f-6874fbafe0f3/AJYxlq4Zs0.json" background="transparent" speed="1" style={{ width: "110px", height: "auto", margin: "10px" }} loop autoplay></dotlottie-player>
      </header>
      <div className="materials-container">
        {learningMaterials.length > 0 ? (
          learningMaterials.map((material) => (
            <div key={material._id} className="material">
              <p className="material-title">{material.title}</p>
              <button onClick={() => handlePdfClick(material._id)}>View PDF</button>
            </div>
          ))
          ) : (
            <p>No learning materials found</p>
          )}
      </div>
    </div>
  )
}

export default LearningMaterials
