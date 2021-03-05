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
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  const body = document.querySelector('#emails-view');
  body.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  if (mailbox === 'inbox') {
    // GET the emails from the API
    fetch('/emails/inbox')
    .then(response => response.json())
    // display the emails
    .then(emails => {
      // Print emails 
      console.log(emails);
      emails.forEach(email => {
        const preview = document.createElement('div');
        preview.setAttribute("class", "email-preview");
      });
  });
    
  }
}