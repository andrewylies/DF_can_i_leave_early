(function () {
    const REQUIRED_HOURS_PER_DAY = 8;

    // 총 업무시간 파싱
    function parseTime(text) {
        const match = text.match(/총 업무시간 (\d+):(\d+)/);
        if (!match) return { hours: 0, minutes: 0 };
        return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
    }

    // 시간 -> 분 변환
    function calculateMinutes({ hours, minutes }) {
        return hours * 60 + minutes;
    }

    // 총 업무시간 계산
    function getTotalWorkHours() {
        const events = document.querySelectorAll('.calendar-event.is-warning');
        let totalMinutes = 0;

        events.forEach(event => {
            const parentDate = event.closest('.calendar-date');
            if (parentDate && !parentDate.classList.contains('is-today')) {
                const time = parseTime(event.textContent);
                totalMinutes += calculateMinutes(time);
            }
        });

        return totalMinutes;
    }

    // 반차 횟수 계산
    function getHalfDayCount() {
        const dates = document.querySelectorAll('.calendar-date');
        let halfDayCount = 0;

        dates.forEach(date => {
            const events = date.querySelectorAll('.calendar-event');
            const hasHalfDay = Array.from(events).some(event => event.textContent.trim() === '반차');
            const hasWorkTime = Array.from(events).some(event => {
                const time = parseTime(event.textContent);
                return calculateMinutes(time) > 0;
            });

            if (hasHalfDay && hasWorkTime) halfDayCount++;
        });

        return halfDayCount;
    }

    // 반차 포함 필수 근무시간 계산
    function getRequiredWorkHoursWithHalfDays() {
        const dates = document.querySelectorAll('.calendar-date');
        let totalWorkDays = 0;

        dates.forEach(date => {
            const hasValidWorkTime = Array.from(date.querySelectorAll('.calendar-event')).some(event => {
                if (event.textContent.match(/총 업무시간 00:00/)) return false;
                return event.textContent.match(/총 업무시간 (\d+):(\d+)/);
            });

            if (hasValidWorkTime && !date.classList.contains('is-today')) {
                totalWorkDays++;
            }
        });

        const halfDayCount = getHalfDayCount();
        const adjustedWorkDays = totalWorkDays - halfDayCount;

        return (adjustedWorkDays * REQUIRED_HOURS_PER_DAY * 60) + (halfDayCount * 4 * 60);
    }

    // 마일리지 출력
    function displayMileage() {
        const totalMinutesWorked = getTotalWorkHours();
        const requiredMinutesWithHalfDays = getRequiredWorkHoursWithHalfDays();

        if (totalMinutesWorked === 0) {
            document.querySelector('.current-mileage')?.remove();
            return;
        }

        const difference = requiredMinutesWithHalfDays - totalMinutesWorked;
        const mileageDiv = document.querySelector('.current-mileage') || createMileageDiv();
        const titleElement = mileageDiv.querySelector('.title');

        if (difference === 0) {
            updateMileageTitle(titleElement, '0시간 0분👍', 'green');
        } else {
            const hours = Math.floor(Math.abs(difference) / 60);
            const minutes = Math.abs(difference) % 60;
            const sign = difference >= 0 ? '-' : '+';
            const color = difference >= 0 ? 'red' : 'blue';
            updateMileageTitle(titleElement, `${sign}${hours}시간 ${minutes}분`, color);
        }
    }

    // 마일리지 DOM 생성
    function createMileageDiv() {
        const mileageDiv = document.createElement('div');
        mileageDiv.className = 'column is-one-third-mobile current-mileage';
        mileageDiv.innerHTML = `
            <div class="content" style="width:100%;">
                <div class="is-size-7 has-text-centered is-vacation-title" style="position: relative">
                    마일리지 <span style="position:absolute; font-size: 0.5rem;padding-top: 0.2rem; opacity: 0.5">&nbsp;(금일 제외)</span>
                </div>
                <div class="title is-size-6 has-text-centered"></div>
            </div>
        `;
        document.querySelector('.columns.is-mobile.is-multiline')?.appendChild(mileageDiv);
        return mileageDiv;
    }

    // 마일리지 업데이트
    function updateMileageTitle(element, text, color) {
        element.textContent = text;
        element.style.color = color;
    }

    // 남은 근로시간 출력
    function displayRemainingHours() {
        const tags = document.querySelectorAll('.tags .tag');
        const standardTag = Array.from(tags).find(tag => tag.textContent.includes('기준 근로시간'));
        const totalTag = Array.from(tags).find(tag => tag.textContent.includes('총 근로시간'));

        if (!standardTag || !totalTag) return;

        const [standardHours, standardMinutes] = standardTag.nextElementSibling.textContent.trim().split(':').map(Number);
        const [totalHours, totalMinutes] = totalTag.nextElementSibling.textContent.trim().split(':').map(Number);

        const remainingMinutes = Math.max(0, (standardHours * 60 + standardMinutes) - (totalHours * 60 + totalMinutes));
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;

        updateRemainingHoursTag(remainingHours, remainingMins);
    }

    // 남은 근로시간 업데이트
    function updateRemainingHoursTag(hours, minutes) {
        const container = document.querySelector('div.field.is-grouped.is-grouped-multiline');
        if (!container) return;

        const existingTag = container.querySelector('.tag').textContent.includes('남은 근로시간');
        if (existingTag) existingTag.parentElement.remove();

        const newDiv = document.createElement('div');
        newDiv.className = 'control';
        newDiv.innerHTML = `
            <div class="tags has-addons">
                <span class="tag">남은 근로시간</span>
                <span class="tag is-primary" style="${hours === 0 && minutes === 0 ? '' : 'background-color: #ff3860'}">
                    ${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')}
                </span>
            </div>
        `;
        container.appendChild(newDiv);
    }

    // 버전 정보
    function displayVersionInfo() {
        const version = chrome.runtime.getManifest().version;

        console.log(`
   _____          _   _   _____             
  / ____|   /\\   | \\ | | |_   _|            
 | |       /  \\  |  \\| |   | |              
 | |      / /\\ \\ | . \` |   | |              
 | |____ / ____ \\| |\\  |  _| |_             
  \\_____/_/____\\_\\_|_\\_| |_____|____        
 | |    |  ____|   /\\ \\    / /  ____|       
 | |    | |__     /  \\ \\  / /| |__          
 | |    |  __|   / /\\ \\ \\/ / |  __|         
 | |____| |____ / ____ \\  /  | |____        
 |______|______/_/_   \\_\\/___|______|_____  
 |  ____|   /\\   | |    |  __ \\ \\   / /__ \\ 
 | |__     /  \\  | |    | |__) \\ \\_/ /   ) |
 |  __|   / /\\ \\ | |    |  _  / \\   /   / / 
 | |____ / ____ \\| |____| | \\ \\  | |   |_|  
 |______/_/    \\_\\______|_|  \\_\\ |_|   (_)  

 ------------------------------------------
 v${version}
 📞 Support
 https://github.com/andrewylies/DF_can_i_leave_early
 ------------------------------------------
`);
    }


    //run
    displayMileage();
    displayRemainingHours();
    displayVersionInfo();
})();
