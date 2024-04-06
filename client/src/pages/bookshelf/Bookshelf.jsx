import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ProfileSection } from "../../components/ProfileSection/ProfileSection"
import { privateAxios } from "../../../utils/api"
import { MdBookmarkBorder, MdBookmark } from "react-icons/md"
import './bookshelf.css'

const Bookshelf = () => {
  const [ bookshelf, setBookshelf ] = useState({})
  const [ showProfileSection, setShowProfileSection ] = useState(false)
  const userID = localStorage.getItem("userID")
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserBookshelf()
  }, [userID])

  const fetchUserBookshelf = async () => {
    try {
      const response = await privateAxios.get(`/users/${userID}/book-shelf`, { withCredentials: true })

      if (response.status === 200) {
        console.log(response.data.bookshelf)
        setBookshelf(response.data.bookshelf)
      }
    } catch (err) {
      if (err.response && err.response.data) {
        alert(err.response.data.error || 'An error occurred. Please try again.')
      } else {
        alert('An error occurred. Please try again.')
      }
    }
  }

  const handlePdfClick = (materialID) => {
    navigate(`/view-material/${materialID}`)
  }

  const deleteFromBookshelf = async (materialID) => {
    try {
      const response = await privateAxios.delete(`/users/${userID}/delete-from-bookshelf/${materialID}`, { withCredentials: true })

      if (response.status === 200) {
        alert(response.data.msg)
        setBookshelf(prevBookshelf => prevBookshelf.filter(item => item._id !== materialID))
      }
    } catch (err) {
      if (err.response) {
        console.log(err.response)
        alert(err.response)
      }
    }
  }


  return (
    <div className="bookshelf-container">
       <header>
        <ProfileSection 
            showProfileSection = {showProfileSection}
            setShowProfileSection = {setShowProfileSection}
          />
        <div className="header-content">
          <ion-icon name="arrow-back" onClick={() => navigate('/')}></ion-icon>
          <h1>Bookshelf</h1>
        </div> 
        <dotlottie-player src="https://lottie.host/c7b8849d-1b44-4cb0-a68f-6874fbafe0f3/AJYxlq4Zs0.json" background="transparent" speed="1" style={{ width: "110px", height: "auto", margin: "10px" }} loop autoplay></dotlottie-player>
      </header>
      <div className="books-containers">
        {bookshelf.length > 0 ? (
          bookshelf.map((book) => (
            <div key={book._id} className="book">
              <MdBookmark className="bookmark-icon bookmarked" onClick={() => deleteFromBookshelf(book._id)}  />
              <p className="material-title">{book.title}</p>
              <p className="material-author">{book.author}</p>
              <u className="underline"></u>
              <button className="pdf-button"  onClick={() => handlePdfClick(book._id)}>View PDF</button>
            </div>
          ))
        ) : (
          <p>No learning materials found</p>
        )
        } 
      </div>
    </div>
  )
}

export default Bookshelf