const bot='./assets/bot.svg';
const user='./assets/user.svg';

const img=document.createElement('img');
img.src=bot;

const form= document.querySelector('form');
const chatContainer=document.querySelector('#chat_container');


let loadInterval;

function loader(element){
    element.textContent='';
    loadInterval=setInterval(()=>{
        element.textContent+='.';
        if(element.textContent==='....'){
            element.textContent='';
        }
    },300)
}

function typeText(element,text){
    let index=0;
    let interval= setInterval(()=>{
        if(index<text.length){ // indicates that user is still typing
            element.innerHTML+=text.charAt(index); // writes character one at a time
            index++;
        }
        else{
            clearInterval(interval); // clears interval
        }
    },20)
}

function generateId(){
    const timestamp=Date.now();
    const randomNumber = Math.random();
    // generates unique random hexadecimal
    const hexadecimalStr=randomNumber.toString(16);
    // returns current time of chat and unique HD ID
    return `id-${timestamp}-${hexadecimalStr}`;
}


function chatIdentifier(isAI, value, uniqueId){
    return (
        `
        <div class="wrapper ${isAI && 'ai'}">
            <div class="chat">
                <div class="profile">
                    <img src="${isAI ? bot : user}" alt="${isAI ? 'bot' : 'user'}"/>
                </div>
                <div class="message" id="${uniqueId}">${value}</div>
            </div>
        </div>
        `
    )
}

const handleSubmit = async (e) => {
    e.preventDefault();
    
     const welcome = document.getElementById("welcome");
    if (welcome) {
        welcome.remove();
    }
    const data = new FormData(form);
    const prompt = data.get('prompt');
    
    chatContainer.innerHTML += chatIdentifier(false, prompt, generateId());
    
    form.reset();
    
    const uniqueId = generateId();
    chatContainer.innerHTML += chatIdentifier(true, "", uniqueId);
    
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    
    const messageDiv = document.getElementById(uniqueId);
    loader(messageDiv);

    // fetch data from server to get bot's response
    const response = await fetch("http://localhost:5000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: data.get("prompt") })
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML=' ';

    if(response.ok){
        const data = await response.json(); // actual data from API
        const parsedData=data.bot.trim();

        typeText(messageDiv,parsedData);
    }
    else{
        const err= await response.text();
        messageDiv.innerHTML="Something went wrong.";
        alert(err);
    }
}

form.addEventListener('submit', handleSubmit);

form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default form submission
        handleSubmit(e);
    }
});
// submits using the Enter key button