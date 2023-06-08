document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#compose-form').addEventListener('submit', send_email);

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}
function reply_form(sender,subject,timestamp) {
  compose_email()
  document.querySelector('#compose-recipients').value = `${sender}`;
  document.querySelector('#compose-recipients').setAttribute("disabled","")
}

function read_email(id,mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'block';
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const content = document.querySelector('#content-view');
    content.innerHTML = `
            <ul class="list">
            <li><strong>From:</strong> ${email.sender}</li>
            <li><strong>To:</strong> ${email.recipients}</li>
            <li><strong>Subject:</strong> ${email.subject}</li>
            <li><strong>Timestamp:</strong> ${email.timestamp}</li>
          </ul>
          <article>
            <p>${email.body}</p>
          </article>
          `
    if(mailbox !== 'sent') {
      const btn_arc = document.createElement('button')
      btn_arc.innerHTML = email.archived ? 'Unarchived' : 'Archived';
      btn_arc.addEventListener('click', function() {
        fetch(`/emails/${id}`,{
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        })
        .then( () => load_mailbox('inbox'))
      });
      const btn_reply = document.createElement('button')
      btn_reply.innerHTML = 'Reply'
      btn_reply.addEventListener('click', function() {
        reply_form(email.sender, email.subject, email.timestamp)
      });
      const content_div = document.querySelector('#content-view')
      content_div.append(btn_arc)
      content_div.append(btn_reply)
    }
  });
  fetch(`/emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(singleEmail => {
      const element = document.createElement('div');
      element.innerHTML = `
        <h5 class="sender"> ${singleEmail.sender} </h5> 
        <h5 class="subject"> ${singleEmail.subject} </h5>
        <p class="timestamp"> ${singleEmail.timestamp}</p>
      `;

      element.addEventListener('click', function() {
        read_email(singleEmail.id, mailbox)
      });

      element.className = singleEmail.read ? "read" : "unread";
      element.classList.add('email_container');
      document.querySelector('#emails-view').append(element);
      
    })
  })
}

function send_email(event) {
  event.preventDefault();

  const recipients  = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;


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
    console.log(result)
    load_mailbox('sent')
  })
}