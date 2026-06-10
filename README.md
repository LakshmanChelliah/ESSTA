# Edmonton Senior Sri Lankan Tamils Association (ESSTA)

A website for the Edmonton Senior Sri Lankan Tamils Association, built from the content in *Web Page draft 3.docx*.

## About

ESSTA supports senior Sri Lankan Tamils in Edmonton to lead healthy, vibrant lives through social participation, wellness programs, companionship, outings, and cultural engagement.

## View the Site Locally

Open `index.html` directly in your browser, or run a local server:

```bash
# Python
python -m http.server 8080

# Node.js (if npx is available)
npx serve .
```

Then visit [http://localhost:8080](http://localhost:8080).

## Project Structure

```
ESSLTA/
├── index.html           # Main page
├── essta-info.json      # Organisation data and form config (edit emails here)
├── css/
│   └── styles.css       # Styles
├── js/
│   ├── main.js          # Navigation, form validation & submission
│   └── globe.js         # Animated globe in the hero section
├── IMG_0520.JPG         # Logo (used as favicon and in-page logo)
└── README.md
```

## Sections

- **Hero**: Association name, mission summary, and animated globe
- **Heritage**: Tamil history and Sri Lankan Tamil migration
- **Our Community**: Edmonton Tamil community contributions
- **About ESSTA**: Purpose of the association
- **Leadership**: Board of Directors and President profile
- **Programs**: Objectives and planned activities
- **Membership**: Application form (submits via FormSubmit)
- **Contact**: Get in touch

## Membership Form

Applications are emailed using [FormSubmit](https://formsubmit.co). Recipients are configured in `essta-info.json`:

- **Primary:** `contact.inquiries_email` (`info@essta.ca`)
- **CC:** `contact.other_emails` (joint secretaries)

**First-time setup:** After deploying, submit one test application. FormSubmit sends an activation link to `info@essta.ca` — click it once to enable delivery. CC recipients do not need to activate.

To change who receives applications, edit the email addresses in `essta-info.json` only.

## Customization

- To change recipient emails, edit `essta-info.json` — do not edit `index.html` or `main.js`
- To change the form subject line, edit `membership_form.subject` in `essta-info.json`
- Deploy to GitHub Pages, Netlify, or Vercel for a public URL

## License

Content © Edmonton Senior Sri Lankan Tamils Association (ESSTA).
