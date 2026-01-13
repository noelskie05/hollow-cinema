// ===== GLOBAL VARIABLES =====
let selectedMovie = '';
let selectedTime = '';
let selectedSeats = [];
let selectedPaymentMethod = '';
const TICKET_PRICE = 250;
const SEAT_ROWS = ['A','B','C','D','E'];
const SEATS_PER_ROW = 5;

// ===== MOVIE DATA =====
const movies = [
  {
    title: "Mission: Impossible - The Final Reckoning",
    img: "images/mission_impossible.jpg",
    carouselBg: "images/carousel1.jpg",
    trailer: "https://www.youtube.com/embed/fsQgc9pCyDU",
    status: "now",
    description: "Ethan Hunt and his IMF team must track down a terrifying new weapon."
  },
  {
    title: "Final Destination: Bloodlines",
    img: "images/final_destination.jpg",
    carouselBg: "images/carousel2.jpg",
    trailer: "https://www.youtube.com/embed/UWMzKXsY9A4",
    status: "now",
    description: "Death returns with a vengeance as a new group of unwitting victims must find a way to cheat their demise."
  }
];
const showtimes = ["10:00 AM","01:00 PM","04:00 PM","07:00 PM","10:00 PM"];

// ===== DOM ELEMENTS =====
const movieGrid   = document.getElementById('movies');
const heroCarousel= document.getElementById('heroCarousel');
const trailerModal= document.getElementById('trailerModal');
const trailerFrame= document.getElementById('trailerFrame');
const bookingModal= document.getElementById('bookingModal');
const movieTitlePlaceholder = document.getElementById('movieTitlePlaceholder');

// ===== CAROUSEL =====
function renderHeroCarousel() {
  if (!heroCarousel) return;
  heroCarousel.innerHTML = '';
  movies.forEach((movie, index) => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    if (index === 0) item.classList.add('active');
    item.style.backgroundImage = `url(${movie.carouselBg})`;
    item.innerHTML = `
      <div class="content">
        <h1>${movie.title}</h1>
        <p>${movie.description}</p>
        <button class="watch-trailer-btn"
          data-trailer="${movie.trailer}"
          data-title="${movie.title}">Watch Trailer</button>
      </div>`;
    heroCarousel.appendChild(item);
  });

  heroCarousel.querySelectorAll('.watch-trailer-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      openTrailer(btn.dataset.trailer, btn.dataset.title);
    });
  });
}

// ===== CAROUSEL NAVIGATION =====
let currentSlide = 0;
function showCarouselSlide(i) {
  const items = document.querySelectorAll('.carousel-item');
  items.forEach((item, idx) => item.classList.toggle('active', idx === i));
}
document.getElementById('carouselPrev').addEventListener('click', () => {
  currentSlide = (currentSlide - 1 + movies.length) % movies.length;
  showCarouselSlide(currentSlide);
});
document.getElementById('carouselNext').addEventListener('click', () => {
  currentSlide = (currentSlide + 1) % movies.length;
  showCarouselSlide(currentSlide);
});

// ===== MOVIE GRID =====
function renderMovies(status) {
  if (!movieGrid) return;
  movieGrid.innerHTML = '';
  const filtered = movies.filter(m => m.status === status);
  if (!filtered.length) {
    movieGrid.innerHTML = '<p style="text-align:center;margin-top:30px;">No movies available.</p>';
    return;
  }
  filtered.forEach(movie=>{
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${movie.img}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <button onclick="openBooking('${movie.title}')">Book Now</button>`;
    movieGrid.appendChild(card);
  });
}

// ===== TRAILER MODAL =====
function openTrailer(url,title){
  if (!trailerModal || !trailerFrame) return;
  trailerFrame.src = url + "?autoplay=1";
  trailerModal.style.display = 'flex';
}
function closeTrailer(){
  trailerFrame.src = '';
  trailerModal.style.display = 'none';
}

// ===== BOOKING MODAL =====
function openBooking(title){
  selectedMovie = title;
  movieTitlePlaceholder.textContent = title;
  bookingModal.style.display = 'flex';
  resetBookingForm();
  renderSeats();
}
function closeBooking(){ bookingModal.style.display='none'; }

function resetBookingForm(){
  ['bookingDate','ticketCount','personalName','personalEmail','personalPhone']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=id==='ticketCount'?'1':''; });
  selectedTime = '';
  selectedSeats = [];
  selectedPaymentMethod = '';
  document.getElementById('bookingStep1').style.display='block';
  document.getElementById('bookingStep2').style.display='none';
  document.getElementById('receipt').style.display='none';
}

// ===== SEATS =====
function renderSeats(){
  const container=document.getElementById('seatsContainer');
  if(!container) return;
  container.innerHTML='';
  container.style.gridTemplateColumns=`repeat(${SEATS_PER_ROW},1fr)`;
  SEAT_ROWS.forEach(row=>{
    for(let i=1;i<=SEATS_PER_ROW;i++){
      const seat=document.createElement('div');
      const label=`${row}${i}`;
      seat.className='seat';
      seat.textContent=label;
      seat.addEventListener('click',()=>toggleSeat(seat,label));
      container.appendChild(seat);
    }
  });
}
function toggleSeat(seat,label){
  const max=parseInt(document.getElementById('ticketCount').value);
  if(seat.classList.contains('selected')){
    seat.classList.remove('selected');
    selectedSeats=selectedSeats.filter(s=>s!==label);
  }else if(selectedSeats.length<max){
    seat.classList.add('selected');
    selectedSeats.push(label);
  }else alert(`You can select only ${max} seats.`);
}

// ===== BOOKING FLOW =====
function goNext(){
  const date=document.getElementById('bookingDate').value;
  const count=parseInt(document.getElementById('ticketCount').value);
  if(!date) return alert("Pick a date.");
  if(!selectedTime) return alert("Pick a time.");
  if(selectedSeats.length!==count) return alert(`Select ${count} seat(s).`);
  document.getElementById('summaryMovie').textContent=selectedMovie;
  document.getElementById('summaryDate').textContent=date;
  document.getElementById('summaryTime').textContent=selectedTime;
  document.getElementById('summaryTickets').textContent=count;
  document.getElementById('summarySeats').textContent=selectedSeats.join(', ');
  document.getElementById('summaryTotal').textContent=`₱${(count*TICKET_PRICE).toFixed(2)}`;
  document.getElementById('bookingStep1').style.display='none';
  document.getElementById('bookingStep2').style.display='block';
}
function goBack(){
  document.getElementById('bookingStep1').style.display='block';
  document.getElementById('bookingStep2').style.display='none';
}
function confirmBooking(){
  const name=document.getElementById('personalName').value;
  const email=document.getElementById('personalEmail').value;
  if(!name || !email) return alert("Name and Email required.");
  if(!selectedPaymentMethod) return alert("Select payment method.");
  const total=(parseInt(document.getElementById('ticketCount').value)*TICKET_PRICE).toFixed(2);
  document.getElementById('receipt').innerHTML=`
    <h3>Booking Confirmed</h3>
    <p>Movie: ${selectedMovie}</p>
    <p>Name: ${name}</p>
    <p>Email: ${email}</p>
    <p>Date/Time: ${document.getElementById('bookingDate').value} – ${selectedTime}</p>
    <p>Seats: ${selectedSeats.join(', ')}</p>
    <p>Payment: ${selectedPaymentMethod}</p>
    <p>Total: ₱${total}</p>`;
  document.getElementById('bookingStep2').style.display='none';
  document.getElementById('receipt').style.display='block';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
  // time slots
  const timeWrap=document.getElementById('timeSlotsContainer');
  showtimes.forEach(t=>{
    const btn=document.createElement('button');
    btn.className='time-slot-btn';
    btn.textContent=t;
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.time-slot-btn').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTime=t;
    });
    timeWrap?.appendChild(btn);
  });
  // payment options
  document.querySelectorAll('input[name="paymentMethod"]').forEach(r=>{
    r.addEventListener('change',e=>selectedPaymentMethod=e.target.value);
  });
  renderHeroCarousel();
  renderMovies('now');
});

// ===== MODAL CLOSE ON OUTSIDE CLICK =====
window.addEventListener

// ===== TAB SWITCHING FIX =====
function switchTab(event, status) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');
  renderMovies(status);
}
