const { redisClient } = require('../utils/redisClient')
const { generateTokens } = require('../middleware/verifyToken')
const bcrypt = require('bcrypt') // Importing bcrypt for password hashing
const nodemailer = require('nodemailer') // Importing nodemailer for sending emails
const crypto = require('crypto') // Importing crypto for generating random codes
const { 
  validateUserData,
  validateEmail,
  validatePassword
} = require('../validators/inputValidation')
/**
 * Sends a verification email with a verification code.
 * 
 * @param {string} email - The recipient's email address.
 * @param {string} verificationCode - The verification code to be sent.
 * @returns {Promise<void>} - A Promise that resolves once the email is sent.
 */
const sendVerificationEmail = async (email, verificationCode) => {
  try {
     // Create a transporter using nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD
      },
    })

    // Configure email options
    const mailOptions = {
      from: process.env.USER,
      to: email,
      subject: 'Email Verification',
      text: `Your verification code is: ${verificationCode}`,
    }

    // Send the email
    await transporter.sendMail(mailOptions)
  } catch (error) {
    // Handle errors and throw an error for the caller to handle
    console.error('Error sending verification email:', error.message)
    throw new Error('Failed to send verification email.')
  }
}

/**
 * Generates a random verification code.
 * 
 * @returns {string} - The generated verification code.
 */
const generateVerificationCode = () => {
  // Generate random bytes and convert them to hexadecimal string
  return crypto.randomBytes(3).toString('hex')
}

/**
 * Hashes a password using bcrypt.
 * 
 * @param {string} password - The password to be hashed.
 * @returns {Promise<string>} - A Promise that resolves with the hashed password.
 */
const hashPassword = async (password) => {
  try {
    // Hash the password with bcrypt
    return await bcrypt.hash(password, 10)
  } catch (error) {
     // Handle errors and throw an error for the caller to handle
    console.error('Error hashing password:', error.message)
    throw new Error('Failed to hash password.')
  }
}

/**
 * Handles registration of a student.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {UserRepository} userRepository - The user repository instance.
 * @returns {void}
 */
const studentRegistration = async (req, res, userRepository) => {
  // Extracts necessary details from request body
  const { email, password, passwordConfirmation, chosenDepartment, chosenRole, chosenProgram } = req.body

  try {
    // Validate user data
    validateUserData(req.body)

    // Check if user already exists
    const existingUser = await userRepository.findExistingUser(email)

    // If user already exists, returns an error
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Validate chosen role
    if (chosenRole !== ROLES.STUDENT) {
      return res.status(400).json({ error: 'Your role should be a student' })
    }

    // Check if the chosen department exists
    const department = await Department.findById(chosenDepartment);
    if (!department) {
      return res.status(404).json({ error: 'Department doesn\t exist' })
    }

    // Check if the chosen program exists
    const program = await Program.findById(chosenProgram);
    if (!program) {
      return res.status(404).json({ error: 'Program doesn\t exist' })
    }

      // Extract username from email
    const usernameMatch = email.match(/^([a-zA-Z0-9._-]+)@panpacificu\.edu\.ph$/)
    const username = usernameMatch ? usernameMatch[1].split('.')[0] : ''

    // Check if password and password confirmation match
    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Password do not match'})
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Generate verification code
    const verificationCode = generateVerificationCode()

    // Create user in the database
    await userRepository.createUser({ email, username, password: hashedPassword, departmentID: department, verificationCode, programID: program, role: chosenRole })

    // Set timeout to delete unverified user after a certain period
    setTimeout(async () => {
      const expiredUser = await userRepository.findOneAndDelete({ email, verified: false });
      if (expiredUser) {
        console.log(`Account for ${email} deleted due to expiration`);
      }
    }, 30 * 60 * 1000)

    // Send verification email
    await sendVerificationEmail(email, verificationCode)
    
     // Respond with success message
    res.status(200).json({ msg: 'Verification code sent. Please check your email'})
  } catch (error) {
     // Handle errors
    console.error('Student registration error:', error.message)
    res.status(500).json({ error: `Failed to register student. ${error.message} ` })
  }
}

/**
 * Handles registration of staff.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {UserRepository} userRepository - The user repository instance.
 * @returns {void}
 */
const staffRegistration = async (req, res, userRepository) => {
  try {
    // Extracts necessary details from request body
    const { email, password, passwordConfirmation, chosenRole } = req.body

     // Validate email format
    validateEmail(req.body.email)

    // Check if required fields are provided
    if (!email || !password || !passwordConfirmation || !chosenRole) {
      return res.status(400).json({ error: 'Please fill in all the required fields' })
    }

    // Check if the email is in the array of staff or librarian emails
    const staffEmails = ['johnlino.demonteverde@panpacificu.edu.ph'] // Add staff emails to this array
    const librarianEmails = ['johnlino.demonteverde@panpacificu.edu.ph'] // Add librarian emails to this array

    // Check if user role is authorized to register
    if ((chosenRole === ROLES.STAFF && !staffEmails.includes(email)) || (chosenRole === ROLES.LIBRARIAN && !librarianEmails.includes(email))) {
      return res.status(403).json({ error: `You are not authorized to register as a ${chosenRole}` });
    }

    // Check if user already exists
    const existingUser = await userRepository.findExistingUser(email)
    
    // If user already exists, returns an error
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Validate email format
    validateEmail(email)

    // Validate password format
    validatePassword(password)
    
    // Extract username from email
    const usernameMatch = email.match(/^([a-zA-Z0-9._-]+)@panpacificu\.edu\.ph$/)
    const username = usernameMatch ? usernameMatch[1].split('.')[0] : ''

    // Check if password and passwordConfirmation matches
    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Password do not match'})
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Generate verification code
    const verificationCode = generateVerificationCode()

    // Create a new user instance
    await userRepository.createUser({
      email,
      username,
      password: hashedPassword,
      verificationCode,
      role: chosenRole,
    })

    // Send verification code
    await sendVerificationEmail(email, verificationCode)

    // Respond with success message
    res.status(200).json({ msg: 'Verification code sent. Check your email to complete registration' })
  } catch (error) {
    // Handle errors
    console.error('Staff registration error:', error.message)
    res.status(500).json({ error: 'Failed to register staff. Please try again later.' })
  }
}

/**
 * Logs in a user by verifying email and password, generating tokens, and setting cookies.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {UserRepository} userRepository - The user repository instance.
 * @param {LogRepository} logRepository - The log repository instance.
 * @returns {void}
 */
const logIn = async (req, res, userRepository, logRepository) => {
  try {
    // Destructure request body
    const { email, password } = req.body 

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are BOTH required"})
    }

    // Validate email format
    const emailValidationResult = validateEmail(email)
    if (!emailValidationResult.isValid) {
      return res.status(400).json({ error: emailValidationResult.errorMessage })
    }

    // Find user by email
    const user = await userRepository.findUserByEmail(email)

    // If user not found
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Incorrect password. Please try again.'})
    }

    // If user's email is not verified
    if(user.verificationCode !== null) {
      return res.status(400).json({ error: 'Please verify your email first'})
    }

    // Prepare log data
    const logData = {
      userId: user._id,
      timestamp: new Date(),
      action: 'login',
    }

    // Add user's program ID and department ID to logData if they exist
    if (user.programID) {
      logData.userProgramId = user.programID;
    }
    if (user.departmentID) {
      logData.userDepartmentId = user.departmentID;
    }

    // Format timestamp
    const options = {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
    logData.timestamp = logData.timestamp.toLocaleString('en-PH', options)

    // Save login activity to the database only if program ID and department ID exist
    if (logData.userProgramId && logData.userDepartmentId) {
      await logRepository.createLog(logData)
    }

    // Generate tokens
    const tokens = generateTokens(user)

    // Set cookies with access and refresh tokens
    const accessToken = tokens.accessToken
    const refreshToken = tokens.refreshToken
    res.cookie('refreshToken', refreshToken, { httpOnly: true })
    res.cookie('accessToken', accessToken, { httpOnly: true })

    // Send response with tokens and user information
    res.status(200).json({
      accessToken,
      refreshToken,
      userID: user._id,
      role: user.role,
      msg: 'User logged in successfully'
    })
  } catch (error) {
    // Handle errors
    console.error('Error logging in:', error);
    res.status(500).json({ error : `Error logging in. ${error.message} ` })
  }
}

/**
 * Logs out a user by clearing cookies and deleting user-related data from Redis.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void}
 */
const logOut = async (req, res) => {
  const { userID } = req.params
  try {
    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    // Delete user-related data from Redis
    await redisClient.del(`user-details:${userID}`)
    await redisClient.del(`programs:${userID}`)
    await redisClient.del(`courses:${userID}`)
    await redisClient.del(`materials:${userID}`)
    await redisClient.del(`material:${userID}`)

    // Send success message
    res.status(200).json({ msg: 'Logged out successfully' })
  } catch (error) {
    // Handle errors
    console.error('Error logging out:', error)
    res.status(500).json({ error : 'Error logging out. Please try again later.' })
  }
}

/**
 * Verifies user email by comparing verification code and updates user verification status.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {UserRepository} userRepository - The user repository instance.
 * @returns {void}
 */
const verifyEmail = async (req, res, userRepository) => {
  try {
    const { email, verificationCode } = req.body

    // Find user by email
    const user = await userRepository.findUserByEmail(email)

    // If user not found
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // If verification code is incorrect
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Incorrect verification code' })
    }

    // Update user's verification status
    user.verified = true
    user.verificationCode = null
    await user.save()

    // Respond with success message
    res.status(200).json({ msg: 'Email verified successfully. User registered.' })
  } catch (error) {
    // Handle errors
    console.error('Error verifying email:', error)
    res.status(500).json({ error : 'Error verifying email. Please try again later.' })
  }
}

module.exports = { studentRegistration, staffRegistration, logIn, logOut, verifyEmail }
