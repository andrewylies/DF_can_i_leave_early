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
                    <input class="input calc-input calc-input_hh" type="number" value="0" min="0" max="999" step="1" style="width: 50px; margin-right: 5px;">
                    <span style="margin-right: 5px;">:</span>
                    <input class="input calc-input calc-input_mm" type="number" value="00" min="0" max="59" step="1" style="width: 50px;">
                `;
            } else {
                row.innerHTML = `
                    <button class="calc-time-row__sign" aria-label="+" type="button" style="margin-right: 10px;">+</button>
                    <input class="input calc-input calc-input_hh" type="number" value="0" min="0" max="999" step="1" style="width: 50px; margin-right: 5px;">
                    <span style="margin-right: 5px;">:</span>
                    <input class="input calc-input calc-input_mm" type="number" value="00" min="0" max="59" step="1" style="width: 50px;">
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

    // 실행
    createTimeCalculator();
})();
