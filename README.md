# Business-Incubator-Platform-and-DBMS

> *Where raw ideas meet structured growth.*

An open-source incubator management system built on **Express.js + PostgreSQL + EJS**, with an **Electron** desktop layer for admins — unifying project tracking, mentorship, workshops, resources, and funding into one server-centric platform. Web-facing for entrepreneurs, desktop-powered for the people running the show.

---

## The Problem

Business incubators like Creativa run on spreadsheets, scattered tools, and manual follow-ups. Admins can't see the full picture. Entrepreneurs have no structured place to track their journey. Mentors get assigned over WhatsApp. Funding requests disappear into inboxes.

The result: slow decisions, zero transparency, and startups that stall — not because the idea was bad, but because the system managing them was.

---

## The Solution

Our Platform replaces the chaos with a single, structured platform — two interfaces, one database, zero ambiguity.

Entrepreneurs get a web app where they register, submit startup ideas solo or as a team, track their project through every stage, book workspaces, attend workshops, and request funding — all from one dashboard that actually tells them what's happening.

Admins get a desktop app with direct database access. They review and approve projects, assign mentors, schedule workshops, manage facilities, handle investor matching, and generate reports — without touching a spreadsheet.

Mentors see their assigned projects and workshops. Investors see funding requests and portfolio status. Every role gets exactly what it needs, nothing more.

---

## Project Stages

Every project lives at one of three stages — and the system tracks the full journey.

```
  ╔══════════════════╗       ╔══════════════════╗       ╔══════════════════╗
  ║      IDEA        ║  ───► ║       MVP        ║  ───► ║    SCALE-UP      ║
  ╠══════════════════╣       ╠══════════════════╣       ╠══════════════════╣
  ║ Submit concept   ║       ║ Build & test     ║       ║ Expand market    ║
  ║ Form your team   ║       ║ Attend workshops ║       ║ Secure funding   ║
  ║ Await approval   ║       ║ Use facilities   ║       ║ Pitch investors  ║
  ║ Get a mentor     ║       ║ Iterate fast     ║       ║ Grow the team    ║
  ╚══════════════════╝       ╚══════════════════╝       ╚══════════════════╝
         │                          │                          │
    Admin reviews              Mentor guides             Investor assigned
    & approves                 & tracks KPIs             via platform
```

## Tech Stack

```
Frontend     →  HTML · Tailwind CSS · JavaScript · EJS
Backend      →  Node.js · Express.js
Database     →  PostgreSQL
Desktop      →  Electron
```

---

## ERD

<img width="2169" height="2106" alt="Untitled" src="https://github.com/user-attachments/assets/ac959951-9e6d-455d-a806-ca985bce7437" />


---

<img width="1024" height="1024" alt="system" src="https://github.com/user-attachments/assets/cc089452-2d96-46d2-825a-5c7bad77aaf6" />


**Flow summary:**
1. Entrepreneur registers on the web → unique ID auto-generated
2. Project submitted → Admin reviews on desktop app
3. Approval triggers email notification to all team members
4. Mentor assigned via desktop → appears in entrepreneur's dashboard
5. Workshops, resources, and funding all managed through the same loop

---

## Demo — Web App


https://github.com/user-attachments/assets/fb7989ae-3b50-4c92-a9b0-12b3dcef6b2e


---

## Demo — Desktop App 


https://github.com/user-attachments/assets/8f84ebec-e6f0-4cb2-a873-5b363ffa0cb2


---

## 👥 Contributors

Thanks goes to these wonderful people in the team:

<table>
  <tr>
      <td align="center">
      <a href="https://github.com/Abdelrahman-M-Selim">
        <img src="https://avatars.githubusercontent.com/u/223935419?v=4" width="100px;" alt=""/>
        <br /><sub><b>Abdelrahman Selim</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/aelaraby6">
        <img src="https://avatars.githubusercontent.com/u/154278999?v=4" width="100px;" alt=""/>
        <br /><sub><b>Abdelrahman Elaraby</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/ahmedali109">
        <img src="https://avatars.githubusercontent.com/u/64106924?v=4" width="100px;" alt=""/>
        <br /><sub><b>Ahmed Ali</b></sub>
      </a>
    </td>
</table>

---

## License

Open-source. Built to grow communities, not gatekeep them.
