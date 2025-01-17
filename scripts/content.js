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

    function getRequiredWorkHours() {
        const workDaysElement = Array.from(document.querySelectorAll('.is-vacation-title'))
            .find(el => el.textContent.trim() === '근무일수');
        let workDays = 0;

        if (workDaysElement) {
            const titleElement = workDaysElement.parentElement.querySelector('.title');
            if (titleElement) {
                workDays = parseInt(titleElement.textContent.trim(), 10) || 0;
            }
        }

        return (workDays - 1) * REQUIRED_HOURS_PER_DAY * 60;
    }

    function displayRemainingHours() {
        // 기준 근로시간과 총 근로시간 요소 찾기
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

        newControlDiv.innerHTML = `
        <div class="tags has-addons">
            <span class="tag">남은 기준 근로시간</span>
            <span class="tag is-primary">${remainingHours} : ${remainingMins.toString().padStart(2, '0')}</span>
        </div>
    `;

        const existingRemainingHours = Array.from(tagsContainer.querySelectorAll('.tag'))
            .find(el => el.textContent.includes('남은 기준 근로시간'));
        if (existingRemainingHours) {
            existingRemainingHours.parentElement.parentElement.remove();
        }

        tagsContainer.appendChild(newControlDiv);
    }






    function displayMileage() {
        const totalMinutesWorked = getTotalWorkHours();
        const requiredMinutesWithoutToday = getRequiredWorkHours();

        const difference = requiredMinutesWithoutToday - totalMinutesWorked;
        const hours = Math.floor(Math.abs(difference) / 60);
        const minutes = Math.abs(difference) % 60;
        const sign = difference >= 0 ? '-' : '+';
        const color = difference >= 0 ? 'red' : 'blue';

        let mileageDiv = document.querySelector('.current-mileage');
        if (!mileageDiv) {
            mileageDiv = document.createElement('div');
            mileageDiv.className = 'column is-one-third-mobile current-mileage';
            mileageDiv.innerHTML = `
                <div class="content" style="width:100%;">
                    <div class="is-size-7 has-text-centered is-vacation-title" style="position: relative">
                        마일리지 <span style="position:absolute; font-size: 0.5rem;padding-top: 0.2rem; opacity: 0.5">&nbsp;(금일 제외)</span>
                    </div>
                    <div class="title is-size-6 has-text-centered" style="color: ${color};">
                        ${sign}${hours}시간 ${minutes}분
                    </div>
                </div>
            `;

            const parentElement = document.querySelector('.columns.is-mobile.is-multiline');
            if (parentElement) {
                parentElement.appendChild(mileageDiv);
            }
        } else {
            const titleElement = mileageDiv.querySelector('.title');
            titleElement.textContent = `${sign}${hours}시간 ${minutes}분`;
            titleElement.style.color = color;
        }
    }

    displayMileage();
    displayRemainingHours();
})();
