# 🚗 Smart Parking Monitoring System








An IoT-based **Smart Parking Monitoring System** built using ESP32, sensors, Node.js, Express.js, MongoDB, and a web dashboard. The system monitors parking slot availability, vehicle entry and exit, and provides real-time parking information through a web-based interface.

🔴https://rashithmaduranga.github.io/Smart-Parking-Monitoring-System/
---

## ✨ Key Features

* 🅿️ **Real-Time Parking Monitoring**
  Detects whether parking slots are Available or Occupied using ultrasonic sensors.

* 🚘 **Vehicle Entry & Exit Detection**
  IR sensors detect vehicles entering and leaving the parking area.

* 📊 **Live Web Dashboard**
  Displays parking slot status, vehicle counts, statistics, and parking history.

* 💡 **Smart Lighting**
  Uses an LDR sensor to detect ambient light conditions and control parking lights.

* 🔴🟢 **Slot Status Indicators**
  LEDs provide visual indication of parking slot availability.

* 🚧 **Automatic Barrier Control**
  Servo motors can be used to control entrance and exit barriers.

* 🗄️ **MongoDB Data Storage**
  Stores parking information, vehicle events, and historical data.

* 🔄 **ESP32–Backend Communication**
  Sensor data is transmitted from ESP32 to the backend using HTTP and JSON.

---

## 🛠️ Tech Stack & Components

### 🔧 Hardware

| Component                      | Purpose                         |
| ------------------------------ | ------------------------------- |
| **ESP32-C6**                   | Main IoT controller             |
| **HC-SR04 Ultrasonic Sensors** | Parking slot detection          |
| **IR Sensors**                 | Vehicle entry & exit detection  |
| **LDR Sensor**                 | Ambient light detection         |
| **LEDs**                       | Slot status indication          |
| **Servo Motors**               | Entrance / exit barrier control |
| **LCD / OLED Display**         | Local system information        |

### 💻 Software / Web

| Technology       | Purpose                |
| ---------------- | ---------------------- |
| **HTML5**        | Web structure          |
| **CSS3**         | Web styling            |
| **JavaScript**   | Frontend functionality |
| **Bootstrap**    | Responsive UI          |
| **Chart.js**     | Dashboard charts       |
| **Node.js**      | Backend runtime        |
| **Express.js**   | REST API               |
| **MongoDB**      | Database               |
| **Mongoose**     | MongoDB integration    |
| **Arduino IDE**  | ESP32 programming      |
| **Git & GitHub** | Version control        |

---

## 💻 Software / Web

### 🌐 Frontend

The web dashboard provides a user-friendly interface for monitoring the parking system.

**Main functions:**

* 🅿️ View parking slot availability
* 🚗 View vehicle entry and exit counts
* 📈 View parking statistics
* 📋 View parking history
* 🔄 Monitor system status
* 📊 Display data using charts

**Technologies:**

```text
HTML5
CSS3
JavaScript
Bootstrap
Chart.js
Font Awesome
```

### ⚙️ Backend

The backend manages communication between the ESP32, database, and web dashboard.

**Technologies:**

```text
Node.js
Express.js
JavaScript
Mongoose
CORS
dotenv
REST API
```

### 🗄️ Database

**MongoDB** is used to store:

* Parking slot data
* Vehicle entry events
* Vehicle exit events
* Parking history
* System statistics

### 📡 IoT

The ESP32 collects sensor data and sends it to the backend using **HTTP POST requests with JSON data**.

---

## 📁 Repository Structure

* `/Backend/` – Node.js + Express backend and REST API.
* `/Frontend/` – Web dashboard built with HTML, CSS, and JavaScript.
* `/ESP32/` – ESP32 code for sensors and parking data.
* `.gitignore` – Files and folders excluded from Git.
* `README.md` – Project documentation.

---

## ⚙️ How to Setup

1. **Hardware Setup:** Connect the ultrasonic sensors, IR sensors, LDR, LEDs, servo motors, and display to the ESP32 according to the pin configuration in the `.ino` file.

2. **Backend & Database Configuration:**
   - Install MongoDB and make sure the MongoDB service is running.
   - Create a `.env` file inside the `Backend` folder.
   - Add the `MONGODB_URI` and `PORT` configuration to the `.env` file.
   - Run `npm install` to install the required backend dependencies.

3. **Upload Code:** Enter your WiFi credentials and backend IP address in the ESP32 code, then upload the `.ino` file to the ESP32 using Arduino IDE.

4. **Run Dashboard:** Start the Node.js backend using `npm start`, then open the frontend using a local Live Server or web browser.

---


## 📌 Project Purpose

This project demonstrates the integration of **IoT, embedded systems, sensors, REST APIs, web technologies, and databases** to create a real-time smart parking management solution.
