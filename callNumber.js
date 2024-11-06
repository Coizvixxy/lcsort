function parseCallNumber(callNumber) {
    // 將索書號分成幾個部分
    const parts = callNumber.trim().split(' ');
    
    // 檢查是否有特藏號（R, P 等）
    let specialCode = null;
    let startIndex = 0;
    if (parts[0].length === 1 && /^[A-Z]$/.test(parts[0])) {
        specialCode = parts[0];
        startIndex = 1;
    }
    
    // 解析分類號和著者號部分
    let classification = [];
    let authorCutter = null;
    let currentIndex = startIndex;
    
    // 找到年份的位置（如果存在）
    const yearIndex = parts.findIndex((part, index) => 
        index >= startIndex && /^\d{4}[a-zA-Z]?$/.test(part)
    );
    
    // 找到著者號（年份前的最後一個部分）
    let authorIndex = yearIndex !== -1 ? yearIndex - 1 : parts.length - 1;
    
    // 第一部分：主類號（字母部分）
    if (currentIndex < parts.length && /^[A-Z]+/.test(parts[currentIndex])) {
        classification.push(parts[currentIndex]);
        currentIndex++;
        
        // 收集所有次類號，直到著者號
        while (currentIndex < authorIndex) {
            classification.push(parts[currentIndex]);
            currentIndex++;
        }
        
        // 設置著者號
        if (currentIndex === authorIndex && currentIndex < parts.length) {
            authorCutter = parts[currentIndex];
            currentIndex++;
        }
    }
    
    // 組合完整的分類號
    const fullClassification = classification.join(' ');
    
    // 解析其他部分
    let workNumber = null;
    let volumeNumber = null;
    let year = null;
    let yearSuffix = null;
    let copyNumber = null;
    
    while (currentIndex < parts.length) {
        const part = parts[currentIndex];
        
        // 檢查作品號（-1 或 -I 格式）
        if (part.startsWith('-')) {
            workNumber = part;
        }
        // 檢查冊次號（v.1 格式）
        else if (part.startsWith('v.')) {
            volumeNumber = parseInt(part.substring(2));
        }
        // 檢查年份（4位數字，可能帶有後綴字母）
        else if (/^\d{4}[a-zA-Z]?$/.test(part)) {
            year = parseInt(part.substring(0, 4));
            if (part.length > 4) {
                yearSuffix = part.substring(4);
            }
        }
        // 檢查複本號（c.1 格式）
        else if (part.startsWith('c.')) {
            copyNumber = parseInt(part.substring(2));
        }
        
        currentIndex++;
    }
    
    return {
        specialCode,
        classification: fullClassification,
        authorCutter,
        workNumber,
        volumeNumber,
        year,
        yearSuffix,
        copyNumber,
        structure: {
            hasSpecialCode: specialCode !== null,
            classificationParts: classification,
            hasAuthorCutter: authorCutter !== null,
            hasWorkNumber: workNumber !== null,
            hasVolumeNumber: volumeNumber !== null,
            hasYear: year !== null,
            hasYearSuffix: yearSuffix !== null,
            hasCopyNumber: copyNumber !== null
        }
    };
}

function compareCallNumbers(callNumber1, callNumber2) {
    const cn1 = parseCallNumber(callNumber1);
    const cn2 = parseCallNumber(callNumber2);
    
    // 比較特藏號
    if (cn1.specialCode !== cn2.specialCode) {
        if (!cn1.specialCode) return -1;
        if (!cn2.specialCode) return 1;
        return cn1.specialCode.localeCompare(cn2.specialCode);
    }
    
    // 比較分類號
    if (cn1.classification !== cn2.classification) {
        return cn1.classification.localeCompare(cn2.classification);
    }
    
    // 比較著者號
    if (cn1.authorCutter !== cn2.authorCutter) {
        return cn1.authorCutter.localeCompare(cn2.authorCutter);
    }
    
    // 比較作品號
    if (cn1.workNumber !== cn2.workNumber) {
        if (!cn1.workNumber) return -1;
        if (!cn2.workNumber) return 1;
        return cn1.workNumber.localeCompare(cn2.workNumber);
    }
    
    // 比較冊次號
    if (cn1.volumeNumber !== cn2.volumeNumber) {
        if (cn1.volumeNumber === null) return -1;
        if (cn2.volumeNumber === null) return 1;
        return cn1.volumeNumber - cn2.volumeNumber;
    }
    
    // 比較年代號
    if (cn1.year !== cn2.year) {
        if (cn1.year === null) return -1;
        if (cn2.year === null) return 1;
        return cn1.year - cn2.year;
    }
    
    // 比較年份後綴
    if (cn1.yearSuffix !== cn2.yearSuffix) {
        if (!cn1.yearSuffix) return -1;
        if (!cn2.yearSuffix) return 1;
        return cn1.yearSuffix.localeCompare(cn2.yearSuffix);
    }
    
    // 比較複本號
    if (cn1.copyNumber !== cn2.copyNumber) {
        if (cn1.copyNumber === null) return -1;
        if (cn2.copyNumber === null) return 1;
        return cn1.copyNumber - cn2.copyNumber;
    }
    
    return 0;
}

// 修改 markCallNumbers 函數，讓它返回結果而不是直接修改 DOM
function markCallNumbers(callNumber1, callNumber2, result) {
    if (!callNumber1 || !callNumber2) return;
    
    const colors = {
        cn1: 'white',
        cn2: 'white'
    };
    
    if (result < 0) {
        colors.cn1 = '#90EE90'; // 淺綠色
        colors.cn2 = '#FFB6C1'; // 淺紅色
    } else if (result > 0) {
        colors.cn1 = '#FFB6C1'; // 淺紅色
        colors.cn2 = '#90EE90'; // 淺綠色
    }
    
    return colors;
}

// 修改 formatCallNumber 函數
function formatCallNumber(input) {
    if (!input) return input;
    
    // 移除多餘的空格
    let formatted = input.replace(/\s+/g, ' ').trim();
    
    // 檢查小數點後是否有空格，如果沒有就添加
    // 在小數點後面是數字或字母的情況下都添加空格
    let lastIndex = 0;
    while (true) {
        // 找到下一個小數點的位置
        const dotIndex = formatted.indexOf('.', lastIndex);
        if (dotIndex === -1) break; // 沒有找到更多小數點
        
        // 檢查小數點後面的字符
        if (dotIndex + 1 < formatted.length) {
            const nextChar = formatted[dotIndex + 1];
            // 如果小數點後面是數字或字母，且不是空格，就添加空格
            if ((/[0-9A-Za-z]/.test(nextChar)) && nextChar !== ' ') {
                formatted = formatted.slice(0, dotIndex + 1) + ' ' + formatted.slice(dotIndex + 1);
            }
        }
        
        lastIndex = dotIndex + 1;
    }
    
    // 在特殊符號前添加空格
    formatted = formatted
        // 在 -1, -I 等作品號前添加空格
        .replace(/([^\s])(-)/, '$1 -')
        // 在 v.1 前添加空格
        .replace(/([^\s])(v\.)/, '$1 $2')
        // 在 c.1 前添加空格
        .replace(/([^\s])(c\.)/, '$1 $2')
        // 在年份前添加空格
        .replace(/([^\s])(\d{4}[a-zA-Z]?)(?!\d)/, '$1 $2');
    
    // 移除多餘的空格
    formatted = formatted.replace(/\s+/g, ' ').trim();
    
    return formatted;
}

// 更新顏色常量
const PART_COLORS = {
    specialCode: '#eaa090',  // 特藏號：珊瑚色
    classification: '#eda641', // 分類號：橙色
    authorCutter: '#f1c546',  // 著者號：金黃色
    workNumber: '#a2c75b',    // 作品號：淺綠色
    volumeNumber: '#97ceed',  // 冊次號：天藍色
    year: '#7d99c6',         // 年代號：藍色
    yearSuffix: '#7672af',   // 年份後綴：紫色
    copyNumber: '#c7c0db'    // 複本號：淺紫色
};

// 修改 displayCallNumberDetails 函數
function displayCallNumberDetails(callNumber, otherCallNumber) {
    const parsed = parseCallNumber(callNumber);
    const otherParsed = otherCallNumber ? parseCallNumber(otherCallNumber) : null;
    const details = [];
    
    // 添加結構分析
    details.push('索書號結構分析:');
    
    if (parsed.specialCode) {
        const isSame = otherParsed && parsed.specialCode === otherParsed.specialCode;
        const sameTag = isSame ? ' <span style="background-color: white; color: red;">[相同]</span>' : '';
        details.push(`<div style="background-color: ${PART_COLORS.specialCode}">- 特藏號: ${parsed.specialCode}${sameTag}</div>`);
    }
    
    // 顯示分類號的詳細結構
    details.push('- 分類號:');
    parsed.structure.classificationParts.forEach((part, index) => {
        const otherPart = otherParsed?.structure.classificationParts[index];
        const isSame = otherPart && part === otherPart;
        const sameTag = isSame ? ' <span style="background-color: white; color: red;">[相同]</span>' : '';
        
        if (index === 0) {
            details.push(`<div style="background-color: ${PART_COLORS.classification}">  • 主類號: ${part}${sameTag}</div>`);
        } else {
            details.push(`<div style="background-color: ${PART_COLORS.classification}">  • 次類號: ${part}${sameTag}</div>`);
        }
    });
    
    if (parsed.authorCutter) {
        const isSame = otherParsed && parsed.authorCutter === otherParsed.authorCutter;
        const sameTag = isSame ? ' <span style="background-color: white; color: red;">[相同]</span>' : '';
        details.push(`<div style="background-color: ${PART_COLORS.authorCutter}">- 著者號: ${parsed.authorCutter}${sameTag}</div>`);
    }
    
    if (parsed.workNumber) {
        const isSame = otherParsed && parsed.workNumber === otherParsed.workNumber;
        const sameTag = isSame ? ' <span style="background-color: white; color: red;">[相同]</span>' : '';
        details.push(`<div style="background-color: ${PART_COLORS.workNumber}">- 作品號: ${parsed.workNumber}${sameTag}</div>`);
    }
    
    if (parsed.volumeNumber) {
        const isSame = otherParsed && parsed.volumeNumber === otherParsed.volumeNumber;
        const sameTag = isSame ? ' <span style="background-color: white; color: red;">[相同]</span>' : '';
        details.push(`<div style="background-color: ${PART_COLORS.volumeNumber}">- 冊次號: v.${parsed.volumeNumber}${sameTag}</div>`);
    }
    
    if (parsed.year) {
        const isYearSame = otherParsed && parsed.year === otherParsed.year;
        const isYearSuffixSame = otherParsed && parsed.yearSuffix === otherParsed.yearSuffix;
        const yearSameTag = isYearSame ? ' <span style="background-color: white; color: red;">[相同]</span>' : '';
        
        let yearDisplay = `${parsed.year}${yearSameTag}`;
        if (parsed.yearSuffix) {
            const suffixSameTag = isYearSuffixSame ? ' <span style="background-color: white; color: red;">[相同]</span>' : '';
            yearDisplay += `<span style="background-color: ${PART_COLORS.yearSuffix}">${parsed.yearSuffix}${suffixSameTag}</span>`;
        }
        details.push(`<div style="background-color: ${PART_COLORS.year}">- 年代號: ${yearDisplay}</div>`);
    }
    
    if (parsed.copyNumber) {
        const isSame = otherParsed && parsed.copyNumber === otherParsed.copyNumber;
        const sameTag = isSame ? ' <span style="background-color: white; color: red;">[相同]</span>' : '';
        details.push(`<div style="background-color: ${PART_COLORS.copyNumber}">- 複本號: c.${parsed.copyNumber}${sameTag}</div>`);
    }
    
    return details;
}

// 修改 updateResults 函數
function updateResults() {
    const cn1 = document.getElementById('callNumber1');
    const cn2 = document.getElementById('callNumber2');
    
    const value1 = cn1.value;
    const value2 = cn2.value;
    
    if (value1 && value2) {
        const result = compareCallNumbers(value1, value2);
        const resultDiv = document.getElementById('result');
        
        // 始終保持輸入順序，只傳遞比較結果
        resultDiv.innerHTML = formatCallNumberWithColors(value1, value2, result);
        
        // 更新詳細結構
        const details1 = displayCallNumberDetails(value1, value2);
        const details2 = displayCallNumberDetails(value2, value1);
        
        document.getElementById('details1').innerHTML = `
            <div class="details-title">索書號 1 結構</div>
            ${details1.map(detail => `<div class="detail-item">${detail}</div>`).join('')}
        `;
        
        document.getElementById('details2').innerHTML = `
            <div class="details-title">索書號 2 結構</div>
            ${details2.map(detail => `<div class="detail-item">${detail}</div>`).join('')}
        `;
    } else {
        // 如果有輸入框為空，清空結果
        document.getElementById('result').innerHTML = '';
        document.getElementById('details1').innerHTML = '<div class="details-title">索書號 1 結構</div>';
        document.getElementById('details2').innerHTML = '<div class="details-title">索書號 2 結構</div>';
        cn1.style.backgroundColor = 'white';
        cn2.style.backgroundColor = 'white';
    }
}

// 修改 formatCallNumberWithColors 函數
function formatCallNumberWithColors(first, second, result) {
    const firstParsed = parseCallNumber(first);
    const secondParsed = parseCallNumber(second);
    
    function colorPart(text, type) {
        return `<span style="background-color: ${PART_COLORS[type]}">${text}</span>`;
    }
    
    function formatSingleCallNumber(parsed) {
        let result = [];
        
        if (parsed.specialCode) {
            result.push(colorPart(parsed.specialCode, 'specialCode'));
        }
        
        result.push(colorPart(parsed.classification, 'classification'));
        
        if (parsed.authorCutter) {
            result.push(colorPart(parsed.authorCutter, 'authorCutter'));
        }
        
        if (parsed.workNumber) {
            result.push(colorPart(parsed.workNumber, 'workNumber'));
        }
        
        if (parsed.volumeNumber) {
            result.push(colorPart(`v.${parsed.volumeNumber}`, 'volumeNumber'));
        }
        
        if (parsed.year) {
            let yearText = parsed.year.toString();
            if (parsed.yearSuffix) {
                yearText += colorPart(parsed.yearSuffix, 'yearSuffix');
            }
            result.push(colorPart(yearText, 'year'));
        }
        
        if (parsed.copyNumber) {
            result.push(colorPart(`c.${parsed.copyNumber}`, 'copyNumber'));
        }
        
        return result.join(' ');
    }
    
    const firstFormatted = formatSingleCallNumber(firstParsed);
    const secondFormatted = formatSingleCallNumber(secondParsed);
    
    let resultText;
    if (result < 0) {
        resultText = "索書號 1 在 索書號 2 之前";
    } else if (result > 0) {
        resultText = "索書號 2 在 索書號 1 之前";
    } else {
        resultText = "兩個索書號相同";
    }
    
    return `
        <div style="margin-bottom: 10px;">
            <strong>索書號 1:</strong> <span style="color: ${result < 0 ? 'green' : 'red'}">${firstFormatted}</span>
        </div>
        <div style="margin-bottom: 10px;">
            <strong>索書號 2:</strong> <span style="color: ${result > 0 ? 'green' : 'red'}">${secondFormatted}</span>
        </div>
        <div>
            <strong>比較結果:</strong> ${resultText}
        </div>
    `;
} 