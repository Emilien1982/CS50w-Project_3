document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  const alert = document.querySelector('#alert-compose');

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

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
        // empty the fields - ###### SURPERFLU #######
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
    console.log(recipients);
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
    // Print emails 
    console.log(emails);
    emails.forEach(email => {
      const preview = document.createElement('div');
      preview.setAttribute("class", "email-preview");
      if (email.read) {
        preview.style.backgroundColor = "#CCC";
      }
      preview.innerHTML = `<span class="sender">${email.sender}</span><span class="body">${email.body}</span><span class="timestamp">${email.timestamp}</span>`;
      preview.addEventListener('click', () => load_email(email.id));
      page_body.appendChild(preview);
    });
  });
}

const load_email = (email_id) => {
  const page_body = document.querySelector('#email-view');

  // Fetch the email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    console.log(email);
    // Update the HTML
        //EVENTUELLEMENT MODIFIER L AFFICHAGE DES DESTINATAIRES POUR INTEGRER UN ESPACE ENTRE EUX (APRES LA VIRGULE)
    page_body.innerHTML = `
      <p><strong>From: </strong>${email.sender}</p>
      <p><strong>To: </strong>${email.recipients}</p>
      <p><strong>Subject: </strong>${email.subject}</p>
      <p><strong>Timestamp: </strong>${email.timestamp}</p>
      <hr>
      <p>${email.body}</p>`;
    
    // Mark email as read (if not done yet)
    if (!email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
  });
  
  // Show compose view and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  page_body.style.display = 'block';

}
