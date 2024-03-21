const { LearningMaterial, Course } = require('../models/e-book')
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require('firebase/storage')
const { redisClient, DEFAULT_EXP } = require('../utils/redisClient')
const { app } = require('../config/firebase.config')
const { Types } = require('mongoose'); // Import Types for ObjectId validation

const storage = getStorage(app)


const uploadMaterial = async (req, res, learningMaterialRepository, courseRepository) => {
  const { courseId } = req.params
  const title = req.body.title
  const file = req.file

  try {
    // Find the course within the specified program
    const course = await courseRepository.findAndValidateCourse(courseId)

    // If course not found, return an error
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    const storageRef = ref(storage, `learning-materials/${file.originalname}`)

    console.log(storageRef)
    
    // Upload file bytes to Firebase Storage
    const snapshot = await uploadBytesResumable(storageRef, file.buffer)

    console.log('file uploaded')

    console.log(snapshot.metadata.fullPath)

    // Create a new learning material using the uploaded file's metadata
    const learningMaterial = await learningMaterialRepository.createLearningMaterial({
      title: title,
      file: snapshot.metadata.fullPath
    })

    // Add the learning material to the course's list of materials
    await courseRepository.addLearningMaterialToCourse(courseId, learningMaterial._id)

    // Respond with the created learning material
    res.status(201).json(learningMaterial)
  } catch (error) {
    // Handle errors and respond with an error message
    res.status(500).json({ error: error.message })
  }
}

const getCourseLearningMaterial = async (req, res, courseRepository, learningMaterialRepository) => {
  const { courseID } = req.params

  try {

    const cachedMaterials = await redisClient.get(`materials:${courseID}`)

    if (cachedMaterials) {
      try {
        const learningMaterials = JSON.parse(cachedMaterials)
        return res.status(200).json({ learningMaterials })
      } catch (err) {
        console.error('Error parsing cached materials:', err)
        res.status(500).json({ msg: 'Error retrieving materials from Redis' })
        return
      }
    }

    const course = await courseRepository.findAndValidateCourse(courseID)

    if(!course) {
      return res.status(404).json({ msg: 'Course subject is not found' })
    }

    const learningMaterialsID = course.learningMaterials

    if (!learningMaterialsID) {
      return res.status(404).json({ msg: 'Course subject learning materials ID are not found'})
    }

    const learningMaterials = await learningMaterialRepository.findLearningMaterial(learningMaterialsID)

    if (!learningMaterials) {
      return res.status(404).json({ msg: 'Course subject learning materials are not found' })
    }

    console.log(learningMaterials)

    await redisClient.SET(`materials:${courseID}`, JSON.stringify(learningMaterials), {EX: DEFAULT_EXP})

    res.status(200).json({ learningMaterials })
  } catch (error) {
    res.status(500).json({ error: error.message})
  }
} 

const getMaterial = async (req, res, learningMaterialRepository) => {
  try {
    const { materialID } = req.params

    if (!materialID) {
      return res.status(400).json({ msg: 'Material ID is not found' })
    }

    // Find the learning material in MongoDB
    const material = await learningMaterialRepository.findAndValidateMaterial(materialID)

    if (!material) {
      return res.status(404).json({ msg: 'Material not found' })
    }

    // Get the download URL of the file from Firebase Storage
    const downloadUrl = await getDownloadURL(ref(storage, material.file))

    // Attach the download URL to the material object
    const materialWithUrl = { ...material.toObject(), downloadUrl }

    res.status(200).json({ material: materialWithUrl })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  uploadMaterial,
  getCourseLearningMaterial,
  getMaterial
}