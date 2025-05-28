# Bitespeed Backend Task: Identity Reconciliation

This project is a backend service that reconciles user identities based on email and phone numbers.

## 📋 Features
- `/identify` POST endpoint for identifying and linking user contacts.
- Supports contact merging and prioritization.
- Built with Node.js, Express, TypeScript, Prisma, and SQLite.

## 🚀 How to Run Locally
1. Install dependencies:
    ```
    npm install
    ```
2. Run Prisma migrations:
    ```
    npx prisma db push
    ```
3. Start the server:
    ```
    npm run dev
    ```
4. Test the `/identify` endpoint using Postman or curl.

## 🌐 Deployment
This project can be deployed to platforms like Render, Vercel, or Heroku.

