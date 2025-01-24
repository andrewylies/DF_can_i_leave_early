(function () {
    const REQUIRED_HOURS_PER_DAY = 8;
    let ADD_TODAY = false;

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
            if (parentDate && (ADD_TODAY || !parentDate.classList.contains('is-today'))) {
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

            if (hasValidWorkTime && (ADD_TODAY || !date.classList.contains('is-today'))) {
                totalWorkDays++;
            }
        });

        const halfDayCount = getHalfDayCount();
        const adjustedWorkDays = totalWorkDays - halfDayCount;

        return (adjustedWorkDays * REQUIRED_HOURS_PER_DAY * 60) + (halfDayCount * 4 * 60);
    }

    // 마일리지 출력
    function displayMileage() {
        const tags = document.querySelectorAll('.tags .tag');

        if (tags.length > 0) {
            document.querySelector('.total-work-time')?.remove();
        } else {
            const totalMinutesWorked = getTotalWorkHours();

            const totalHoursWorked = Math.floor(totalMinutesWorked / 60);
            const totalMinutesWorkedRemainder = totalMinutesWorked % 60;

            let totalWorkTimeDiv = document.querySelector('.total-work-time');
            if (!totalWorkTimeDiv) {
                totalWorkTimeDiv = document.createElement('div');
                totalWorkTimeDiv.className = 'column is-one-third-mobile total-work-time';
                totalWorkTimeDiv.innerHTML = `
                <div class="content" style="width:100%;">
                    <div class="is-size-7 has-text-centered is-vacation-title" style="position: relative">
                        총 근로시간
                    </div>
                    <div class="title is-size-6 has-text-centered"></div>
                </div>
            `;
                const parentElement = document.querySelector('.columns.is-mobile.is-multiline');
                if (parentElement) {
                    parentElement.append(totalWorkTimeDiv);
                }
            }

            const totalWorkTitleElement = totalWorkTimeDiv.querySelector('.title');
            totalWorkTitleElement.textContent = `${totalHoursWorked}시간 ${totalMinutesWorkedRemainder}분`;
            totalWorkTitleElement.style.color = '#333';
        }

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
            const minutes = Math.abs(difference % 60);
            const sign = difference >= 0 ? '-' : '+';
            const color = difference >= 0 ? 'red' : 'blue';
            updateMileageTitle(titleElement, `${sign}${hours}시간 ${minutes}분`, color);
        }
    }

    function addToggleAddTodayBtn(){
        let hasIsToday = false;
        const parentElement = document.querySelector('.is-multiline').parentElement;
        const events = document.querySelectorAll('.calendar-event.is-warning');

        events.forEach(event => {
            if (hasIsToday) return;
            const parentDate = event.closest('.calendar-date');
            if (parentDate && (parentDate.classList.contains('is-today'))) {
                hasIsToday = true;
            }
        });

        if (!hasIsToday) return;

        if(parentElement) {
            const toggleBtn = document.createElement('button');
            const baseStyle =`display:block; width:100%; margin-bottom:1.5rem; padding:10px 0; border-radius:6px; cursor:pointer;`;
            const activeStyle =`border:1px solid #23d160; background:#23d160; color:#fff;`;
            const disabledStyle =`border:1px dashed #dbdbdb; background:#f5f5f5; color:#888585;`;
            const activeText = '📅 오늘 포함 계산';
            const disabledText = '🚫 오늘 미포함 계산';
            toggleBtn.className = 'is-add-today-btn';
            toggleBtn.innerHTML = disabledText;
            toggleBtn.style.cssText = baseStyle + disabledStyle;
            toggleBtn.style.fontWeight = 'bold';
            toggleBtn.onclick = (e) => {
                e.preventDefault();
                ADD_TODAY = !ADD_TODAY;
                toggleBtn.style.cssText = baseStyle + (ADD_TODAY ? activeStyle : disabledStyle);
                toggleBtn.innerHTML = ADD_TODAY ? activeText : disabledText;
                toggleBtn.style.fontWeight = 'bold';
                displayMileage();
            }
            parentElement.after(toggleBtn);
        }
    }


    // 마일리지 DOM 생성
    function createMileageDiv() {
        const mileageDiv = document.createElement('div');
        mileageDiv.className = 'column is-one-third-mobile current-mileage';
        mileageDiv.innerHTML = `
            <div class="content" style="width:100%;">
                <div class="is-size-7 has-text-centered is-vacation-title" style="position: relative">
                    마일리지
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

        const existingTag = Array.from(container.querySelectorAll('.tag')).find(tag => tag.textContent.includes('남은 근로시간'));
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

    // 시간 계산기 추가
    function createTimeCalculator() {
        const calculatorWrapper = document.createElement('div');
        calculatorWrapper.id = 'time-calculator-wrapper';
        calculatorWrapper.style.position = 'fixed';
        calculatorWrapper.style.bottom = '20px';
        calculatorWrapper.style.right = '20px';
        calculatorWrapper.style.zIndex = '1000';

        // 토글 버튼
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-calculator-btn';
        toggleButton.style.width = '50px';
        toggleButton.style.height = '50px';
        toggleButton.style.borderRadius = '50%';
        toggleButton.style.border = 'none';
        toggleButton.style.backgroundColor = '#007BFF';
        toggleButton.style.color = 'white';
        toggleButton.style.fontSize = '28px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toggleButton.textContent = '🤔';
        calculatorWrapper.appendChild(toggleButton);

        // 계산기 본체
        const calculator = document.createElement('div');
        calculator.id = 'time-calculator';
        calculator.style.display = 'none';
        calculator.style.width = '300px';
        calculator.style.padding = '15px';
        calculator.style.backgroundColor = '#f9f9f9';
        calculator.style.border = '1px solid #ddd';
        calculator.style.borderRadius = '8px';
        calculator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        calculator.style.fontFamily = 'Arial, sans-serif';
        calculator.style.marginTop = '10px';

        calculator.innerHTML = `
            <h3 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 10px;">시간 계산기</h3>
            <div class="calc__inter-col calc-inter-col">
                <div class="calc-inter-col__input-rows"></div>
                <button class="btn calc-inter-col__add-btn" type="button" style="cursor:pointer;padding: calc(0.375em - 1px) 0.75em;width: 100%; margin-top: 10px;background-color: #4880db;border: none; border-radius: 4px; color: white;">줄 추가</button>
                <button class="btn calc-inter-col__reset-btn" type="button" style="cursor:pointer;padding: calc(0.375em - 1px) 0.75em;width: 100%; margin-top: 5px;background-color: #ff3860;border: none; border-radius: 4px; color: white;">초기화</button>
                <button class="btn calc-inter-col__calc-btn" type="button" style="cursor:pointer;padding: calc(0.375em - 1px) 0.75em;width: 100%; border-radius: 4px; margin-top: 5px; border: none;">계산</button>
            </div>
            <div id="calculation-result" style="margin-top: 10px; font-size: 14px; color: #333; text-align: center;"></div>
        `;
        calculatorWrapper.appendChild(calculator);

        document.body.appendChild(calculatorWrapper);

        const inputRowsContainer = calculator.querySelector('.calc-inter-col__input-rows');
        const addButton = calculator.querySelector('.calc-inter-col__add-btn');
        const resetButton = calculator.querySelector('.calc-inter-col__reset-btn');
        const calculateButton = calculator.querySelector('.calc-inter-col__calc-btn');
        const resultDisplay = calculator.querySelector('#calculation-result');

        // 토글 버튼 이벤트
        toggleButton.addEventListener('click', () => {
            if (calculator.style.display === 'none') {
                calculator.style.display = 'block';
                toggleButton.style.position = 'absolute';
                toggleButton.style.top = '5px';
                toggleButton.style.right = '-3px';
                toggleButton.style.backgroundColor = 'unset';
                toggleButton.style.color = '#c5c5c5';
                toggleButton.style.boxShadow = 'unset';
                toggleButton.textContent = '✘';
            } else {
                calculator.style.display = 'none';
                toggleButton.style.position = 'relative';
                toggleButton.style.top = 'unset';
                toggleButton.style.right = 'unset';
                toggleButton.style.backgroundColor = '#007BFF';
                toggleButton.style.color = 'white';
                toggleButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                toggleButton.textContent = '🤔';
            }
        });

        function createInputRow(isFirstRow = false) {
            const row = document.createElement('div');
            row.className = 'time-row calc-inter-col__calc-time-row calc-time-row';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.marginBottom = '5px';

            if (isFirstRow) {
                row.innerHTML = `
                    <span style="font-size:20px;width: 24.3px;margin-right: 10px; display: flex; justify-content: center; align-items: center">🕒</span>
                    <input class="input calc-input calc-input_hh" type="number" value="0" min="0" max="999" step="1" style="width: 60px; margin-right: 5px;">
                    <span style="margin-right: 5px;">:</span>
                    <input class="input calc-input calc-input_mm" type="number" value="0" min="0" max="59" step="1" style="width: 60px;">
                `;
            } else {
                row.innerHTML = `
                    <button class="calc-time-row__sign" aria-label="+" type="button" style="margin-right: 10px;">+</button>
                    <input class="input calc-input calc-input_hh" type="number" value="0" min="0" max="999" step="1" style="width: 60px; margin-right: 5px;">
                    <span style="margin-right: 5px;">:</span>
                    <input class="input calc-input calc-input_mm" type="number" value="0" min="0" max="59" step="1" style="width: 60px;">
                `;
                const signButton = row.querySelector('.calc-time-row__sign');
                signButton.style.width = '24.3px';

                signButton.addEventListener('click', () => {
                    if (signButton.textContent === '+') {
                        signButton.textContent = '-';
                    } else {
                        signButton.textContent = '+';
                    }
                });
            }

            const hoursInput = row.querySelector('.calc-input_hh');
            const minutesInput = row.querySelector('.calc-input_mm');

            [hoursInput, minutesInput].forEach((input) => {
                input.addEventListener('paste', (e) => {
                    e.preventDefault();

                    const pasteData = e.clipboardData.getData('text').trim();

                    const regex = /(\d+)\s*(시간|h|:)\s*(\d+)?\s*([분m])?/i;
                    const match = pasteData.match(regex);

                    if (!match) {
                        return;
                    }

                    let hours = parseInt(match[1], 10) || 0;
                    let minutes = parseInt(match[3] || '0', 10);

                    if (minutes > 59) {
                        hours += Math.floor(minutes / 60);
                        minutes %= 60;
                    }

                    const formattedHours = String(hours).padStart(2, '0');
                    const formattedMinutes = String(minutes).padStart(2, '0');

                    if (input.classList.contains('calc-input_hh')) {
                        input.value = formattedHours;
                        minutesInput.value = formattedMinutes;
                    } else if (input.classList.contains('calc-input_mm')) {
                        input.value = formattedMinutes;
                        hoursInput.value = formattedHours;
                    }
                });
            });

            inputRowsContainer.appendChild(row);
        }

        function calculateTotalTime() {
            let totalMinutes = 0;

            inputRowsContainer.querySelectorAll('.time-row').forEach((row, index) => {
                const hoursInput = row.querySelector('.calc-input_hh');
                const minutesInput = row.querySelector('.calc-input_mm');
                const signButton = row.querySelector('.calc-time-row__sign');

                const hours = parseInt(hoursInput.value, 10) || 0;
                const minutes = parseInt(minutesInput.value, 10) || 0;
                const rowMinutes = calculateMinutes({ hours, minutes });

                if (index === 0 || !signButton) {
                    totalMinutes += rowMinutes;
                } else if (signButton.textContent === '+') {
                    totalMinutes += rowMinutes;
                } else {
                    totalMinutes -= rowMinutes;
                }
            });

            const totalHours = Math.floor(Math.abs(totalMinutes) / 60);
            const remainingMinutes = Math.abs(totalMinutes % 60);
            const sign = totalMinutes >= 0 ? '' : '-';

            resultDisplay.textContent = `총 시간: ${sign}${totalHours}시간 ${remainingMinutes}분`;
        }

        function resetCalculator() {
            inputRowsContainer.innerHTML = '';
            resultDisplay.textContent = '';
            createInputRow(true);
            createInputRow(false);
        }

        createInputRow(true);
        createInputRow(false);

        addButton.addEventListener('click', () => createInputRow(false));
        calculateButton.addEventListener('click', calculateTotalTime);
        resetButton.addEventListener('click', resetCalculator);
    }


    // 버전 정보
    function displayVersionInfo() {
        const manifest = chrome.runtime.getManifest();
        const version = manifest.version;
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

    // 실행
    displayMileage();
    displayRemainingHours();
    createTimeCalculator();
    displayVersionInfo();
    addToggleAddTodayBtn();
})();
