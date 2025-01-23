(function () {
    const REQUIRED_HOURS_PER_DAY = 8;

    function getTotalWorkHours() {
        const calendarEvents = document.querySelectorAll('.calendar-event.is-warning');
        let totalMinutes = 0;

        calendarEvents.forEach(event => {
            const parentDate = event.closest('.calendar-date');
            if (parentDate && !parentDate.classList.contains('is-today')) {
                const timeText = event.textContent.match(/총 업무시간 (\d+):(\d+)/);
                if (timeText) {
                    const hours = parseInt(timeText[1], 10);
                    const minutes = parseInt(timeText[2], 10);
                    totalMinutes += hours * 60 + minutes;
                }
            }
        });

        return totalMinutes;
    }

    function getHalfDayCount() {
        const calendarDates = document.querySelectorAll('.calendar-date');
        let halfDayCount = 0;

        calendarDates.forEach(date => {
            const events = date.querySelectorAll('.calendar-event');
            let hasHalfDay = false;
            let hasValidWorkTime = false;

            events.forEach(event => {
                if (event.textContent.trim() === '반차') {
                    hasHalfDay = true;
                }
                const workTimeMatch = event.textContent.match(/총 업무시간 (\d+):(\d+)/);
                if (workTimeMatch) {
                    const hours = parseInt(workTimeMatch[1], 10);
                    const minutes = parseInt(workTimeMatch[2], 10);
                    if (hours > 0 || minutes > 0) {
                        hasValidWorkTime = true;
                    }
                }
            });
            if (hasHalfDay && hasValidWorkTime) {
                halfDayCount++;
            }
        });

        return halfDayCount;
    }

    function getRequiredWorkHoursWithHalfDays() {
        const calendarDates = document.querySelectorAll('.calendar-date');
        let totalWorkDays = 0;

        calendarDates.forEach(date => {
            const hasWorkTime = Array.from(date.querySelectorAll('.calendar-event')).some(event => {
                return event.textContent.match(/총 업무시간 (\d+):(\d+)/);
            });

            if (hasWorkTime && !date.classList.contains('is-today')) {
                totalWorkDays++;
            }
        });

        const halfDayCount = getHalfDayCount();

        const adjustedWorkDays = totalWorkDays - halfDayCount;
        return (adjustedWorkDays * REQUIRED_HOURS_PER_DAY * 60) + (halfDayCount * 4 * 60);
    }

    function displayMileage() {
        const totalMinutesWorked = getTotalWorkHours();
        const requiredMinutesWithHalfDays = getRequiredWorkHoursWithHalfDays();

        console.log(totalMinutesWorked,requiredMinutesWithHalfDays);

        if (totalMinutesWorked === 0) {
            const mileageDiv = document.querySelector('.current-mileage');
            if (mileageDiv) {
                mileageDiv.remove();
            }
            return;
        }


        const difference = requiredMinutesWithHalfDays - totalMinutesWorked;

        let mileageDiv = document.querySelector('.current-mileage');
        if (!mileageDiv) {
            mileageDiv = document.createElement('div');
            mileageDiv.className = 'column is-one-third-mobile current-mileage';
            mileageDiv.innerHTML = `
        <div class="content" style="width:100%;">
            <div class="is-size-7 has-text-centered is-vacation-title" style="position: relative">
                마일리지 <span style="position:absolute; font-size: 0.5rem;padding-top: 0.2rem; opacity: 0.5">&nbsp;(금일 제외)</span>
            </div>
            <div class="title is-size-6 has-text-centered"></div>
        </div>
        `;

            const parentElement = document.querySelector('.columns.is-mobile.is-multiline');
            if (parentElement) {
                parentElement.appendChild(mileageDiv);
            }
        }

        const titleElement = mileageDiv.querySelector('.title');

        if (difference === 0) {
            titleElement.textContent = '0시간 0분👍';
            titleElement.style.color = 'green';
        } else {
            const hours = Math.floor(Math.abs(difference) / 60);
            const minutes = Math.abs(difference) % 60;
            const sign = difference >= 0 ? '-' : '+';
            const color = difference >= 0 ? 'red' : 'blue';

            titleElement.textContent = `${sign}${hours}시간 ${minutes}분`;
            titleElement.style.color = color;
        }
    }

    //남은 근로시간
    function displayRemainingHours() {
        const tags = document.querySelectorAll('.tags .tag');

        let standardTimeElement = null;
        let totalTimeElement = null;

        tags.forEach(tag => {
            if (tag.textContent.includes('기준 근로시간')) {
                standardTimeElement = tag;
            }
            if (tag.textContent.includes('총 근로시간')) {
                totalTimeElement = tag;
            }
        });

        if (!standardTimeElement || !totalTimeElement) return;

        const standardValueElement = standardTimeElement.nextElementSibling;
        const totalValueElement = totalTimeElement.nextElementSibling;

        if (!standardValueElement || !totalValueElement) return;

        const [standardHours, standardMinutes] = standardValueElement.textContent.trim().split(':').map(Number);
        const [totalHours, totalMinutes] = totalValueElement.textContent.trim().split(':').map(Number);

        const standardTotalMinutes = standardHours * 60 + standardMinutes;
        const totalWorkedMinutes = totalHours * 60 + totalMinutes;
        const remainingMinutes = Math.max(0, standardTotalMinutes - totalWorkedMinutes);

        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;

        const tagsContainer = document.querySelector('div.field.is-grouped.is-grouped-multiline');
        if (!tagsContainer) return;

        const newControlDiv = document.createElement('div');
        newControlDiv.className = 'control';

        const backgroundColor = remainingHours === 0 && remainingMins === 0 ? '' : 'background-color: #ff3860';

        newControlDiv.innerHTML = `
        <div class="tags has-addons">
            <span class="tag">남은 근로시간</span>
            <span class="tag is-primary" style="${backgroundColor}">${remainingHours.toString().padStart(2, '0')} : ${remainingMins.toString().padStart(2, '0')}</span>
        </div>
    `;

        const existingRemainingHours = Array.from(tagsContainer.querySelectorAll('.tag'))
            .find(el => el.textContent.includes('남은 기준 근로시간'));
        if (existingRemainingHours) {
            existingRemainingHours.parentElement.parentElement.remove();
        }

        tagsContainer.appendChild(newControlDiv);
    }

    displayMileage();
    displayRemainingHours();
})();
