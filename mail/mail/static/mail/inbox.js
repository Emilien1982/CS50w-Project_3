document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(original_email) {
  const alert = document.querySelector('#alert-compose');

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // if original_email.sender (the user clicked the "reply" button), pre-fill the fields
  if (original_email.sender) {
    // checking the presence of original_email.sender to make sure a real email has been passed as an argument (via the reply button)
    // it's important because clicking the "compose" button in the header will pass the click event as an argument. This case, the fileds should stay blank
    console.log("entrer dans le if original_email")
    document.querySelector('#compose-recipients').value = original_email.sender;
    let pre_subject = "";
    if (original_email.subject.slice(0, 4) !== "Re: ") {
      pre_subject = "Re: "
    }
    document.querySelector('#compose-subject').value = pre_subject + original_email.subject;
    document.querySelector('#compose-body').value = `On ${original_email.timestamp} ${original_email.sender} wrote:
    ${original_email.body}
    `;
  }

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Handle form submission
  document.querySelector('#compose-form').onsubmit = (e) => {
    e.preventDefault();
    //console.log(e);
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    // check if empty field before submission
    if (recipients === "" || subject === "" || body === ""){
      alert.innerHTML = "You can't send email with empty body, subject or without recipient";
      alert.style.color = "red";
      alert.style.display = 'block';
      return false;
    }
    // sent the email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      // if the email is sent successfully
      if (result.message) {
        // display a successful message (the one from the serveur response)
        alert.style.color = "green";
        alert.innerHTML = result.message;
        alert.style.display = "block";
        // empty the fields
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
        // wait 2 sec and redirect to the inbox.
        setTimeout(() => {
          load_mailbox('inbox');
          alert.style.display = "none";
        }, 2000);
      }
      // An error append in the sending of email
      else {
        // display an error message (the one from the serveur response)
        alert.style.color = "red";
        alert.innerHTML = result.error;
        alert.style.display = "block";
      }
    });
    return false;
  };
}

function load_mailbox(mailbox) {
  const page_body = document.querySelector('#emails-view');
  
  // Show the mailbox and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  page_body.style.display = 'block';

  // Show the mailbox name
  page_body.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET the emails from the API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  // display the emails
  .then(emails => {
    emails.forEach(email => {
      const preview = document.createElement('div');
      preview.setAttribute("class", "email-preview");
      if (email.read) {
        preview.style.backgroundColor = "#CCC";
      }
      preview.innerHTML = `<span class="sender">${email.sender}</span><span class="subject">${email.subject}</span><span class="timestamp">${email.timestamp}</span>`;
      preview.addEventListener('click', () => load_email(email.id, mailbox));
      page_body.appendChild(preview);
    });
  });
}

const load_email = (email_id,mailbox) => {
  const arch_btn = document.querySelector("#archive-btn");
  arch_btn.style.display = "none";
  const reply_btn = document.querySelector("#reply-btn");
  reply_btn.style.display = "none";

  // Fetch the email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {

    // Fill up the HTML
    document.querySelector("#email-from").innerHTML = "<strong>From: </strong>" + email.sender;
    // Arrange a nice presentation of the recipients. Separated them with comma and space
    let recipients_field = "<strong>To: </strong>";
    email.recipients.forEach((recipient) => {
      recipients_field += recipient + ", ";
    })
    document.querySelector("#email-to").innerHTML = recipients_field.slice(0, -2);
    document.querySelector("#email-subject").innerHTML = "<strong>Subject: </strong>" + email.subject;
    document.querySelector("#email-timestamp").innerHTML = "<strong>Timestamp: </strong>" + email.timestamp;
    document.querySelector("#email-body").innerHTML = email.body;
  
    // update the archive button regarding the mailbox from which email has been clicked
    if (mailbox !== 'sent') {
      let isInbox = mailbox ==='inbox';
      arch_btn.innerHTML = isInbox ? "Archive" : "Unarchive";
      arch_btn.addEventListener('click', () => {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: isInbox
          })
        })
        .then(() => setTimeout(() => load_mailbox('inbox'), 200));
      });
      arch_btn.style.display = "block";
      reply_btn.style.display = "block";
    }
  
    // Set the reply button to passed the correct email as argument
    document.querySelector("#reply-btn").addEventListener('click', () => {
      compose_email(email);
    });

    // Show compose view and hide other views
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    // Mark email as read (if not done yet)
    if (!email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });
    }
  });
}
