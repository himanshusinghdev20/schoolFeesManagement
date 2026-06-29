# Deployment and GitHub Push Guide

This guide provides step-by-step instructions on how to push this project to GitHub and deploy it for production.

## 1. Pushing the Project to GitHub

To store your code safely and make it ready for deployment, you'll first need to push it to a GitHub repository.

### Prerequisites:
- Git must be installed on your computer.
- You must have a GitHub account.

### Steps:
1. **Initialize Git (if not already initialized):**
   Open your terminal in the root folder of the project (`schoolFeesManagement`) and run:
   ```bash
   git init
   ```

2. **Add Files to Staging:**
   ```bash
   git add .
   ```

3. **Commit Your Changes:**
   ```bash
   git commit -m "Initial commit: School Fees Management System"
   ```

4. **Create a Repository on GitHub:**
   - Go to [GitHub](https://github.com/) and log in.
   - Click the **"+"** icon in the top right corner and select **"New repository"**.
   - Give your repository a name (e.g., `fees-receipt-management`).
   - Do **NOT** initialize it with a README, .gitignore, or license (since you already have local files).
   - Click **"Create repository"**.

5. **Link Local Project to GitHub:**
   Copy the repository URL from GitHub (it looks like `https://github.com/yourusername/fees-receipt-management.git`). Then run:
   ```bash
   git branch -M main
   git remote add origin https://github.com/yourusername/fees-receipt-management.git
   git push -u origin main
   ```

---

## 2. Deploying the Project

Since this is a Node.js project with a MySQL database, you need to deploy the Node.js backend and set up a hosted MySQL database.

### Option A: Using Render (Recommended & Free)

[Render](https://render.com/) provides an easy way to deploy Node.js applications and MySQL databases.

#### Step 1: Set up MySQL Database
1. You can use a free MySQL hosting provider like [Aiven](https://aiven.io/), [PlanetScale](https://planetscale.com/), or [Clever Cloud](https://www.clever-cloud.com/).
2. Create a database, and you will get the credentials: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
3. Run your local `database/schema.sql` file on this remote database to create the required tables. (You can use tools like MySQL Workbench or DBeaver to connect and run the SQL).

#### Step 2: Deploy Node.js App on Render
1. Go to [Render](https://render.com/) and create an account.
2. Click **"New +"** and select **"Web Service"**.
3. Connect your GitHub account and select the repository you just pushed (`fees-receipt-management`).
4. Fill in the deployment details:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Scroll down to **"Advanced"** and click **"Add Environment Variable"**. Add the following based on your remote MySQL database:
   - `DB_HOST`: (your remote db host)
   - `DB_USER`: (your remote db user)
   - `DB_PASSWORD`: (your remote db password)
   - `DB_NAME`: (your remote db name)
   - `PORT`: `3000` (Render will assign a port, but adding it doesn't hurt)
6. Click **"Create Web Service"**.

Render will now build and deploy your application. Once finished, you will receive a public URL (e.g., `https://fees-receipt-management.onrender.com`).

---

### Option B: Using a VPS (Hostinger, DigitalOcean, AWS, etc.)

If you have a Linux VPS (Virtual Private Server), you can host both Node.js and MySQL on it.

#### Step 1: Connect to VPS and Install Dependencies
```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install Node.js & npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server
```

#### Step 2: Set up the Database
Log into MySQL on your VPS:
```bash
sudo mysql
```
Run the setup commands:
```sql
CREATE DATABASE fees_management;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON fees_management.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Then import your schema into the remote MySQL instance.

#### Step 3: Clone and Setup Project
```bash
git clone https://github.com/yourusername/fees-receipt-management.git
cd fees-receipt-management
npm install
```
Create an `.env` file on the server and put your database credentials inside.

#### Step 4: Keep the Server Running with PM2
Install PM2 globally to keep the Node app running in the background:
```bash
sudo npm install -g pm2
pm2 start server.js --name "fees-management"
pm2 save
pm2 startup
```

Your app will now run continuously. To expose it to the internet securely, you would set up **Nginx** as a reverse proxy to point port 80/443 to port 3000.
