# WeNews Backend API

A comprehensive backend API for the WeNews Flutter application built with Node.js, Express, and Firebase Firestore.

## Features

- **User Authentication**: Signup, login, password management
- **News Management**: CRUD operations for news articles
- **User Preferences**: Customizable categories, language, notifications
- **Personalization**: Saved articles, reading history, recommendations
- **Security**: JWT authentication, input validation, rate limiting
- **Scalability**: Firebase Firestore for database, cloud storage ready

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS

## Prerequisites

- Node.js (v16 or higher)
- Firebase project with Firestore enabled
- Firebase service account key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `env.example` to `.env`
   - Fill in your Firebase configuration details
   - Set your JWT secret and other environment variables

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Generate a service account key
   - Update your `.env` file with the Firebase credentials

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your_email%40project.iam.gserviceaccount.com

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# News API Configuration
NEWS_API_KEY=your_news_api_key_here
NEWS_API_BASE_URL=https://newsapi.org/v2
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/signup` | User registration | Public |
| POST | `/login` | User authentication | Public |
| POST | `/refresh` | Refresh JWT token | Private |
| POST | `/change-password` | Change password | Private |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password with token | Public |
| GET | `/me` | Get current user profile | Private |

### News (`/api/news`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all news with filters | Public |
| GET | `/trending` | Get trending news | Public |
| GET | `/featured` | Get featured news | Public |
| GET | `/category/:category` | Get news by category | Public |
| GET | `/:id` | Get news by ID | Public |
| POST | `/` | Create news article | Private |
| PUT | `/:id` | Update news article | Private |
| DELETE | `/:id` | Delete news article | Private |
| POST | `/:id/like` | Like/dislike article | Private |
| GET | `/:id/related` | Get related articles | Public |

### User (`/api/user`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/profile` | Get user profile | Private |
| PUT | `/profile` | Update user profile | Private |
| GET | `/saved-articles` | Get saved articles | Private |
| POST | `/save-article` | Save article | Private |
| DELETE | `/saved-articles/:id` | Remove saved article | Private |
| GET | `/reading-history` | Get reading history | Private |
| POST | `/reading-history` | Add to reading history | Private |
| PUT | `/preferences` | Update preferences | Private |
| GET | `/recommendations` | Get personalized recommendations | Private |
| DELETE | `/account` | Delete user account | Private |

## Data Models

### User
- Basic info (username, email, password, name)
- Preferences (categories, language, notifications)
- Saved articles and reading history
- Account status and timestamps

### News
- Content (title, summary, content, images)
- Metadata (category, tags, author, source)
- Engagement (views, likes, dislikes)
- Status and visibility controls
- SEO optimization fields

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Security headers and protection
- **Rate Limiting**: Built-in request throttling

## Firebase Integration

The backend uses Firebase Firestore for:
- **User Management**: Authentication and profile data
- **News Storage**: Articles, metadata, and engagement metrics
- **Real-time Updates**: Live data synchronization
- **Scalability**: Automatic scaling and performance optimization

## Error Handling

- Comprehensive error responses with appropriate HTTP status codes
- Detailed error messages for debugging
- Graceful fallbacks for common scenarios
- Logging for monitoring and troubleshooting

## Testing

```bash
npm test
```

## Deployment

### Firebase Functions (Recommended)
```bash
firebase deploy --only functions
```

### Traditional Hosting
- Deploy to platforms like Heroku, DigitalOcean, or AWS
- Set environment variables in your hosting platform
- Ensure Firebase service account key is properly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation and examples

## Roadmap

- [ ] Real-time notifications
- [ ] Advanced search with Algolia
- [ ] Image upload and management
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] Admin dashboard
- [ ] API rate limiting
- [ ] Caching layer
