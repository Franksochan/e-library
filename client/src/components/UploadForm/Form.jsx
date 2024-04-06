import { useEffect, useState } from 'react'
import api from '../../../utils/api'
import './Form.css'

const Form = ({ onClose, type, ID }) => {
  const [formDatas, setFormDatas] = useState({})
  const [file, setFile] = useState(null)
  const userID = localStorage.getItem("userID")

  useEffect(() => {
    console.log(type)
    console.log(ID)
  }, [ID])

  const handleFieldChange = (e) => {
    const { name, value } = e.target
    setFormDatas((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFile(file)
  }

  const handleSubmission = async (e) => {
    e.preventDefault()
    try {
      let endpoint = ''
      let response
  
      if (type === 'program') {
        endpoint = '/programs/create-programs'
        response = await api.post(endpoint, { title: formDatas.title, description: formDatas.description})
      } else if (type === 'course') {
        response = await api.post(`/courses/programs/${ID}/create-course`, { title: formDatas.title })
      } else if (type === 'learning-material') {
        endpoint = `/learning-materials/courses/${ID}/${userID}`
        let formData = new FormData()
        formData.append('title', formDatas.title)
        formData.append('author', formDatas.author)
        formData.append('file', file)
        response = await api.post(endpoint, formData)
      }

      if (response.status === 201) {
        alert('Data has been submitted successfully')
        onClose()
      }
    } catch (err) {
      if (err.response && err.response.data) {
        alert(err.response.data.error || 'An error occurred. Please try again.')
      } else {
        alert('An error occurred. Please try again.')
      }
    }
  }
  

  let fields
  if (type === 'program') {
    fields = (
      <>
        <input type="text" name="title" placeholder="Program Name" onChange={handleFieldChange} />
        <input type="text" name="description" placeholder="Program Description" onChange={handleFieldChange} />
      </>
    )
  } else if (type === 'course') {
    fields = (
      <>
        <input type="text" name="title" placeholder="Course Name" onChange={handleFieldChange} />
      </>
    )
  } else if (type === 'learning-material') {
    fields = (
      <>
        <input type="text" name="title" placeholder="Material Title" onChange={handleFieldChange} />
        <input type="text" name="author" placeholder="Author" onChange={handleFieldChange} />
        <input type="file" name="file" placeholder="Upload file" onChange={handleFileChange}/>
      </>
    )
  }

  return (
    <>
      <div className="overlay" onClick={onClose} /> 
      <div className="form-container">
        <h2>Add {type}</h2>
        <form onSubmit={handleSubmission}>
          {fields}
          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  )
}

export default Form