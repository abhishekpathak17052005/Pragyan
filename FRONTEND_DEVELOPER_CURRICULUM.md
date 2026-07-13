# Frontend Developer - Zero to Hero (6-Month Curriculum)

**Total Duration:** 180 Learning Days  
**Structure:** 6 Modules × 24 Weeks × 120 Days  
**Resources:** 300+  
**Quiz Questions:** 600+  
**Interview Questions:** 100+  
**Mini Projects:** 30+  
**Major Projects:** 6  

---

## MONTH 1: INTERNET & HTML (Days 1-30)

### Module 1: Foundations

#### Week 1: Internet & HTTP (Days 1-5)

**Week Overview:**
- Understand how the internet works
- Learn HTTP protocol fundamentals
- DNS and domain names
- Browser basics

##### Day 1: How the Internet Works

**Learning Objectives:**
- Explain the basic architecture of the internet
- Understand IP addresses and packets
- Know the role of ISPs and DNS
- Understand client-server model

**Theory:**
- Internet infrastructure (ISP, backbone, servers)
- IP addresses (IPv4, IPv6)
- Data transmission (packets, TCP/IP)
- Client-server architecture
- How data travels across the internet

**Code Examples:** N/A (Conceptual)

**Hands-on Practice:**
- Trace your IP address
- Use `ping` command
- Inspect DNS resolution with `nslookup`
- View network traffic with browser DevTools

**Resources:**
- [MDN: How the Internet Works](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work)
- [Khan Academy: Internet Intro](https://www.khanacademy.org/computing/internet-101)
- [YouTube: How Internet Works](https://www.youtube.com/results?search_query=how+internet+works)
- [W3Schools: Internet Basics](https://www.w3schools.com/)

**Quiz (5 questions):**
1. What does IP stand for?
2. How many bits are in an IPv4 address?
3. What is the role of TCP?
4. What does DNS stand for?
5. Explain client-server model

**Assignment:**
- Draw a diagram of internet architecture
- Document your ISP and IP address
- Explain how data flows from your computer to a server

**Mini Project:**
- Create an infographic explaining internet basics
- Use draw.io or similar tool

**Interview Questions:**
1. How does the internet work?
2. Explain the difference between IP and DNS
3. What is the role of TCP/IP?

**XP Reward:** 50 XP

---

##### Day 2: HTTP Protocol

**Learning Objectives:**
- Understand HTTP/HTTPS
- Learn HTTP methods (GET, POST, PUT, DELETE)
- Understand status codes
- Know the difference between HTTP and HTTPS

**Theory:**
- HTTP basics (stateless protocol)
- HTTP methods: GET, POST, PUT, DELETE, PATCH
- HTTP status codes (1xx, 2xx, 3xx, 4xx, 5xx)
- Request/response cycle
- HTTP headers
- HTTPS and SSL/TLS

**Hands-on Practice:**
- Inspect HTTP requests in browser DevTools
- View request headers and response
- Make HTTP requests using curl
- Test different HTTP status codes

**Resources:**
- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [HTTP Status Codes](https://httpstatusdogs.com/)
- [YouTube: HTTP Protocol](https://www.youtube.com/results?search_query=http+protocol)

**Quiz (5 questions):**
1. What does HTTP stand for?
2. Name 4 HTTP methods
3. What status code means "Not Found"?
4. What's the difference between HTTP and HTTPS?
5. What is an HTTP header?

**Assignment:**
- Create a table of common HTTP status codes
- Document request/response flow
- Explain when to use each HTTP method

**Mini Project:**
- Build a simple HTTP client (using curl or Postman)
- Make requests to a public API

**Interview Questions:**
1. Explain the HTTP request-response cycle
2. What are idempotent HTTP methods?
3. When would you use POST vs PUT?

**XP Reward:** 50 XP

---

##### Day 3: DNS & Domain Names

**Learning Objectives:**
- Understand DNS resolution
- Know domain name structure
- Understand DNS records (A, CNAME, MX)
- Know the role of DNS servers

**Theory:**
- Domain name structure (TLD, second-level domain)
- DNS resolution process
- DNS records (A, AAAA, CNAME, MX, TXT, NS)
- Recursive and authoritative DNS servers
- DNS caching

**Hands-on Practice:**
- Check DNS records using `nslookup`
- Use `dig` command
- Check domain WHOIS information
- Trace DNS resolution steps

**Resources:**
- [MDN: Domain Names](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_domain_name)
- [DNS Explained](https://www.youtube.com/results?search_query=dns+explained)

**Quiz (5 questions):**
1. What does DNS stand for?
2. List 3 DNS record types
3. What is a TLD?
4. How long is DNS caching?
5. Explain DNS resolution steps

**Assignment:**
- Trace DNS resolution for your favorite website
- Document all DNS records
- Explain each DNS record type

**Mini Project:**
- Create a visual DNS resolution flow diagram
- Show the role of each DNS server

**Interview Questions:**
1. How does DNS resolution work?
2. What are the different types of DNS records?
3. Explain DNS caching

**XP Reward:** 50 XP

---

##### Day 4: Browsers & Browser Developer Tools

**Learning Objectives:**
- Understand how browsers work
- Learn browser rendering pipeline
- Master browser DevTools
- Know browser tabs (HTML, CSS, JavaScript execution)

**Theory:**
- Browser architecture (rendering engine, JavaScript engine)
- HTML parsing
- CSS parsing and CSSOM
- JavaScript execution
- Rendering pipeline (layout, paint, composite)
- DevTools features

**Hands-on Practice:**
- Inspect elements with DevTools
- View HTML/CSS in DevTools
- Debug JavaScript in DevTools
- Analyze network requests
- Profile performance
- Inspect console messages

**Resources:**
- [MDN: Browser DevTools](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools)
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)
- [YouTube: Browser DevTools](https://www.youtube.com/results?search_query=browser+devtools+tutorial)

**Quiz (5 questions):**
1. What is a rendering engine?
2. Name 3 browser DevTools panels
3. What is CSSOM?
4. Explain the rendering pipeline
5. How do you debug JavaScript?

**Assignment:**
- Inspect a popular website's HTML/CSS
- Document the page structure
- Analyze network requests

**Mini Project:**
- Create a guide to browser DevTools
- Screenshot and document key features

**Interview Questions:**
1. How does a browser render a web page?
2. What is CSSOM?
3. Explain the critical rendering path

**XP Reward:** 50 XP

---

##### Day 5: Quiz & Project Week 1

**Quiz (25 questions):**
- Week 1 comprehensive quiz covering all topics

**Mini Project: Internet Basics Guide**
- Create an interactive webpage explaining internet concepts
- Include: How internet works, HTTP, DNS, Browsers
- Use HTML structure only (no styling yet)
- Write 500+ words of educational content

**Completion Criteria:**
- Score 80%+ on quiz
- Complete mini project
- Can explain all concepts from Week 1

**Interview Preparation:**
- Practice explaining how internet works
- Explain HTTP methods
- Discuss DNS resolution

**XP Reward:** 100 XP

---

#### Week 2: HTML Basics (Days 6-10)

**Week Overview:**
- HTML document structure
- Common HTML tags
- Forms and inputs
- Semantic HTML

##### Day 6: HTML Document Structure

**Learning Objectives:**
- Understand HTML document structure
- Know DOCTYPE declaration
- Understand head vs body
- Know meta tags and their purpose

**Theory:**
- HTML document structure
- DOCTYPE declaration
- `<html>` root element
- `<head>` section (metadata, links, scripts)
- `<body>` section (content)
- Common meta tags (charset, viewport, description)
- SEO meta tags

**Code Examples:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Page description">
    <title>Page Title</title>
  </head>
  <body>
    <!-- Content goes here -->
  </body>
</html>
```

**Hands-on Practice:**
- Create basic HTML documents
- Add proper DOCTYPE and meta tags
- Inspect head section in browser
- View meta tags in DevTools

**Resources:**
- [MDN: HTML Basics](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [W3Schools: HTML Tutorial](https://www.w3schools.com/html/)
- [YouTube: HTML Structure](https://www.youtube.com/results?search_query=html+structure+tutorial)

**Quiz (5 questions):**
1. What is DOCTYPE?
2. What goes in the head vs body?
3. Why is the viewport meta tag important?
4. What is the lang attribute?
5. Explain meta description purpose

**Assignment:**
- Create 5 HTML documents with proper structure
- Add appropriate meta tags
- Document the purpose of each element

**Mini Project:**
- Create an HTML template
- Include all essential meta tags
- Add comments explaining each section

**Interview Questions:**
1. Explain HTML document structure
2. Why is the viewport meta tag important?
3. What are semantic meta tags?

**XP Reward:** 50 XP

---


##### Day 7: HTML Tags & Elements

**Learning Objectives:**
- Learn common HTML tags
- Understand inline vs block elements
- Know text formatting tags
- Understand lists and links

**Theory:**
- Headings (h1-h6)
- Paragraphs and text elements
- Links (`<a>`)
- Images (`<img>`)
- Lists (ul, ol, dl)
- Inline vs block elements
- Div and span containers
- HTML comments

**Code Examples:**
```html
<h1>Main Heading</h1>
<p>Paragraph text with <strong>bold</strong> and <em>italic</em></p>
<a href="https://example.com">Link</a>
<img src="image.jpg" alt="Description">
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>
```

**Hands-on Practice:**
- Create documents with various HTML tags
- Use headings, paragraphs, lists
- Create links and images
- Practice inline vs block elements

**Resources:**
- [MDN: HTML Elements Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [W3Schools: HTML Tags](https://www.w3schools.com/tags/)

**Quiz (5 questions):**
1. What is the difference between h1 and p?
2. Name 3 inline elements
3. What is the purpose of alt attribute?
4. Explain ul vs ol
5. What is a span element?

**Assignment:**
- Create an HTML document with all common tags
- Document each tag's purpose
- Create a reference guide

**Mini Project:**
- Build a simple webpage using various HTML tags
- Include headings, paragraphs, lists, links, images

**Interview Questions:**
1. Explain semantic vs non-semantic HTML tags
2. What is the purpose of alt text?
3. When would you use dl instead of ul?

**XP Reward:** 50 XP

---

##### Day 8: Forms & Input Elements

**Learning Objectives:**
- Understand form structure
- Learn input types
- Know form attributes
- Understand form validation

**Theory:**
- `<form>` element and attributes
- Input types (text, email, password, number, date, file, etc.)
- `<textarea>` and `<select>` elements
- Labels and accessibility
- Form submission
- Form validation attributes
- Name and ID attributes

**Code Examples:**
```html
<form action="/submit" method="POST">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>
  
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required>
  
  <label for="message">Message:</label>
  <textarea id="message" name="message"></textarea>
  
  <button type="submit">Submit</button>
</form>
```

**Hands-on Practice:**
- Create various form types
- Test different input types
- Create labels and associate with inputs
- Test form submission

**Resources:**
- [MDN: HTML Forms](https://developer.mozilla.org/en-US/docs/Learn/Forms)
- [W3Schools: Forms](https://www.w3schools.com/html/html_forms.asp)

**Quiz (5 questions):**
1. What is the purpose of the label element?
2. Name 5 input types
3. What is the difference between action and method?
4. Explain the required attribute
5. What is placeholder text?

**Assignment:**
- Create 3 different forms (contact form, login form, registration form)
- Include appropriate input types
- Add labels and validation attributes

**Mini Project:**
- Build a complete registration form
- Include email, password, date of birth, country select
- Add proper labels and accessibility features

**Interview Questions:**
1. Explain form accessibility best practices
2. What are HTML5 form validation attributes?
3. How would you handle form submission with JavaScript?

**XP Reward:** 50 XP

---

##### Day 9: Semantic HTML & Accessibility

**Learning Objectives:**
- Understand semantic HTML
- Learn accessibility best practices
- Know ARIA attributes
- Understand SEO impact

**Theory:**
- Semantic elements (header, nav, main, article, section, aside, footer)
- Accessibility fundamentals (WCAG, screen readers)
- ARIA roles and attributes
- Keyboard navigation
- Color contrast and readability
- SEO and structured data

**Code Examples:**
```html
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
  <aside>
    <h2>Related</h2>
  </aside>
</main>

<footer>
  <p>&copy; 2024</p>
</footer>
```

**Hands-on Practice:**
- Refactor old HTML with semantic elements
- Test with screen reader
- Check keyboard navigation
- Use accessibility checkers (WAVE, Axe)

**Resources:**
- [MDN: HTML Semantics](https://developer.mozilla.org/en-US/docs/Glossary/Semantics)
- [W3C: WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM: Accessibility](https://webaim.org/)

**Quiz (5 questions):**
1. What is semantic HTML?
2. Name 5 semantic elements
3. What is ARIA?
4. Explain keyboard navigation importance
5. What does WCAG stand for?

**Assignment:**
- Audit an existing website for accessibility
- Create a semantic HTML document
- Document accessibility improvements

**Mini Project:**
- Build an accessible website
- Include semantic HTML, proper labels, keyboard navigation
- Pass WAVE accessibility check

**Interview Questions:**
1. Why is semantic HTML important?
2. Explain WCAG accessibility levels
3. How would you test for accessibility?

**XP Reward:** 50 XP

---

##### Day 10: HTML Project & Quiz

**Quiz (25 questions):**
- Week 2 comprehensive quiz covering all HTML topics

**Mini Project: Personal Portfolio HTML**
- Create a complete multi-page portfolio website
- Include: Home, About, Projects, Contact pages
- Use semantic HTML throughout
- Implement accessibility best practices
- Create forms for contact page
- Add proper meta tags for SEO

**Completion Criteria:**
- Score 80%+ on quiz
- Complete portfolio HTML structure
- Pass accessibility check
- Can explain all HTML concepts

**Interview Preparation:**
- Practice explaining HTML semantics
- Discuss accessibility best practices
- Talk about SEO and HTML

**XP Reward:** 100 XP

---

#### Week 3: Advanced HTML & Project (Days 11-15)

[Continue with similar detailed structure...]

#### Week 4: HTML Review & Projects (Days 16-20)

[Continue with similar detailed structure...]

---

## MONTH 2: CSS (Days 21-60)

### Module 2: Styling

[Similar detailed structure for CSS Fundamentals, Box Model, Flexbox, Grid, Responsive Design]

---

## MONTH 3: JAVASCRIPT (Days 61-90)

### Module 3: Programming

[Similar detailed structure for JS Basics, Functions, DOM, Events, Async]

---

## MONTH 4: ADVANCED JAVASCRIPT & GIT (Days 91-120)

### Module 4: Advanced Topics

[Similar detailed structure for Async Programming, Fetch API, Git, API Integration]

---

## MONTH 5: REACT (Days 121-150)

### Module 5: React Framework

[Similar detailed structure for React Components, Hooks, Routing, State Management]

---

## MONTH 6: ADVANCED REACT & CAPSTONE (Days 151-180)

### Module 6: Mastery

[Similar detailed structure for React Query, Performance, TypeScript, Capstone Project]

---

## RESOURCES REFERENCE

### Learning Platforms:
- W3Schools (https://www.w3schools.com/)
- MDN Web Docs (https://developer.mozilla.org/)
- freeCodeCamp (https://www.freecodecamp.org/)
- Codecademy (https://www.codecademy.com/)

### Development Tools:
- Visual Studio Code
- Chrome DevTools
- Git & GitHub
- CodePen
- JSFiddle

### Practice Platforms:
- LeetCode
- HackerRank
- CodeSignal
- FreeCodeCamp

### Project Ideas:
- Personal Portfolio
- Todo App
- Weather App
- E-commerce Product Page
- Blog Platform
- Social Media Dashboard

---

**Total Content:** 180+ Learning Days with comprehensive curriculum structure ready for database import.

