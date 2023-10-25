'use strict';
const month = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const container = document.querySelector('.sidebar-container');
const formInput = document.querySelector('.form-input');
const inputType = document.querySelector('.box-type');
const inputDistance = document.querySelector('.box-distance');
const inputDuration = document.querySelector('.box-duration');
const inputCadence = document.querySelector('.box-cadence');
const inputElevGain = document.querySelector('.box-elev-gain');
const btnRemoveAll = document.querySelector('.btn-remove-all');
const btnSort = document.querySelector('.btn-sort');
const workouts = document.getElementsByClassName('workout');

class Workout {
  coords;
  id = (Date.now() + '').slice(-8);
  constructor(distance, duration) {
    this.distance = distance;
    this.duration = duration;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(distance, duration, cadence) {
    super(distance, duration);
    this.cadence = cadence;
    this._calcCadence();
  }
  _calcCadence() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, elevGain) {
    super(distance, duration);
    this.elevGain = elevGain;
    this._calcSpeed();
  }
  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #markers = [];
  #sorted = false;
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    formInput.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._switchActivity);
    container.addEventListener('click', this._moveToPopup.bind(this));
    btnRemoveAll.addEventListener('click', this.reset);
    btnSort.addEventListener('click', this._sortWorkouts.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert(`Need coords to work`);
      }
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    this.#map = L.map('map').setView([latitude, longitude], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on(
      'click',
      function (e) {
        this.#mapEvent = e.latlng;
        formInput.classList.remove('hidden');
        inputDistance.focus();
      }.bind(this)
    );
    this.#workouts.forEach(work => {
      this._showMarker(work);
    });
  }

  _newWorkout(e) {
    e.preventDefault();
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevGain = +inputElevGain.value;
    let workout;

    if (inputType.value === 'running') {
      if (!allPositive(distance, duration, cadence))
        return alert('Numbers have to be positive');
      workout = new Running(distance, duration, cadence);
    }
    if (inputType.value === 'cycling') {
      if (!allPositive(distance, duration))
        return alert('Numbers have to be positive');
      workout = new Cycling(distance, duration, elevGain);
    }
    this._renderWorkout(workout);
    this.#workouts.push(workout);
    workout.coords = this.#mapEvent;
    this._showMarker(workout);

    this._clearInput();
    formInput.style.display = 'none';
    formInput.classList.add('hidden');
    setTimeout(() => (formInput.style.display = 'grid'), 1000);
    this._setLocalStorage();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  _clearInput() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevGain.value =
        '';
  }
  _showMarker(workout) {
    const { lat, lng } = workout.coords;
    const marker = L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
          workout.type.charAt(0).toUpperCase() + workout.type.slice(1)
        } on ${month[new Date().getMonth()]} ${new Date().getDate()}`
      )
      .openPopup();

    marker.id = workout.id;
    this.#markers.push(marker);
  }
  _renderWorkout(workout) {
    if (workout.type === 'running') {
      // if (inputType.value === 'running' && workout.type === 'running')
      const html = `<div class="workout form-running" data-id="${workout.id}">
      <p class="label-workout">Running on ${
        month[new Date().getMonth()]
      } ${new Date().getDate()}</p>
      <button class="btn-close">Remove</button>
      <p>

      <span class="icons">🏃‍♂️ </span><span class="numbers">${
        workout.distance
      } </span
        ><span class="units">KM</span>
      </p>
      <p>
      <span class="icons">⏱ </span><span class="numbers">${
        workout.duration
      } </span
      ><span class="units">MIN</span>
      </p>
      <p>
      <span class="icons">⚡️ </span><span class="numbers">${Math.round(
        workout.pace
      )} </span
      ><span class="units">MIN/KM</span>
      </p>
      <p class= "justify-center">
      <span class="icons">🦶🏼 </span><span class="numbers">${
        workout.cadence
      } </span
      ><span class="units">SPM</span>
      </p>
      </div>
      `;
      formInput.insertAdjacentHTML('afterend', html);
    }
    if (workout.type === 'cycling') {
      const html = `<div class="workout form-cycling" data-id="${workout.id}">
      <p class="label-workout">Cycling on ${
        month[new Date().getMonth()]
      } ${new Date().getDate()}</p>
      <button class="btn-close">Remove</button>

      <p>
      <span class="icons">🚴‍♀️ </span><span class="numbers">${
        workout.distance
      } </span
      ><span class="units">KM</span>
      </p>
      <p>
      <span class="icons">⏱ </span><span class="numbers">${
        workout.duration
      } </span
      ><span class="units">MIN</span>
      </p>
      <p>
      <span class="icons">⚡️ </span><span class="numbers">${Math.round(
        workout.speed
      )} </span
      ><span class="units">KM/H</span>
      </p>
      <p class="justify-center">
      <span class="icons">⛰ </span><span class="numbers">${
        workout.elevGain
      } </span
      ><span class="units">M</span>
      </p>`;
      formInput.insertAdjacentHTML('afterend', html);
    }
  }
  _switchActivity() {
    document.querySelector('.box-elev-gain').classList.toggle('hidden1');
    document.querySelector('.elev-gain').classList.toggle('hidden1');
    document.querySelector('.cadence').classList.toggle('hidden1');
    document.querySelector('.box-cadence').classList.toggle('hidden1');
  }
  _removeWorkout(e, workout) {
    const btnClose = document.querySelectorAll('.btn-close');
    btnClose.forEach(btn => {
      if (e.target === btn) {
        const marker = this.#markers.find(mark => workout.id === mark.id);
        const indexWorkout = this.#workouts.indexOf(workout);
        this.#workouts.splice(indexWorkout, 1);
        this._setLocalStorage();
        e.target.closest('.workout').remove();
        this.#map.removeLayer(marker);
      }
    });
  }

  _moveToPopup(e) {
    if (e.target.closest('.form-input')) return;
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      workout => workoutEl.dataset.id === workout.id
    );
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // Remove workout
    this._removeWorkout(e, workout);
  }
  _sortWorkouts(e) {
    e.preventDefault();
    !this.#sorted
      ? this.#workouts.sort((a, b) => b.distance - a.distance)
      : this.#workouts.sort((a, b) => a.distance - b.distance);
    Array.from(workouts).forEach(el => el.remove());
    this.#sorted = !this.#sorted;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
console.log(app);
