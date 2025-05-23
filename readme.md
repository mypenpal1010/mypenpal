## Setup and Installation 

1.  **Clone the repository (or download the files):**
    ```bash
    git clone [https://github.com/your-username/write-me-a-letter.git](https://github.com/your-username/write-me-a-letter.git)
    cd write-me-a-letter
    ```
2.  **Configure EmailJS:**
    * Create an account at [EmailJS](https://www.emailjs.com/).
    * Add a new email service (e.g., Gmail).
    * Create a new email template. Your template should include variables to receive the sender's name, reply information, and the letter content. For example, you might use `{{name}}`, `{{reply}}`, and `{{{letter}}}` (triple braces for HTML content) in your EmailJS template.
    * Open the `emailjs-config.js` file in the project.
    * Replace the placeholder values with your actual EmailJS **Public Key**, **Service ID**, and **Template ID**:
        ```javascript
        // emailjs-config.js
        const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
        const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
        const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
        ```
3.  **Open `index.html` in your browser:**
    You can simply open the `index.html` file directly in a web browser to run the application locally.

## Usage 📝

1.  **Write your letter:** Type your message into the digital paper area.
2.  **Style your text:**
    * Use the "Font Style" dropdown to change the font.
    * Select text and use the formatting buttons (Bold, Italic, Underline, Strikethrough) to apply styles.
    * Use the "Clear" button to remove formatting from selected text.
3.  **Manage Drafts:**
    * Click "💾 Save Draft" to save your current letter to your browser's local storage.
    * If a draft is available, it will be loaded automatically when you open the page.
4.  **Export your letter:**
    * Choose your desired "Export Font Size".
    * Click "🖼️ PNG" to download the letter as a PNG image.
    * Click "📄 PDF" to download the letter as a PDF document.
5.  **Send your letter:**
    * Optionally, fill in "Your Name" and "Your Email or Insta ID (for a reply)".
    * Click "📮 Send Letter". This will send the letter content to the email address configured in your EmailJS account.

## Configuration ⚙️

The primary configuration needed is for EmailJS, as described in the "Setup and Installation" section. Make sure your `emailjs-config.js` file has the correct credentials.

The available fonts can be modified by:
1.  Updating the `<link>` in `index.html` for Google Fonts.
2.  Updating the `<option>` values in the "Font Style" `<select>` element in `index.html`.
3.  Ensuring the `changeFont()` JavaScript function in `script.js` correctly applies the font family.

## Contributing 

Contributions are welcome! If you have ideas for improvements or find any bugs, feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.



