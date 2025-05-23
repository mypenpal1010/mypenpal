// script.js
const letterEditor = document.getElementById('letterEditor');
let letterModified = false;
let letterSentSuccessfully = false;

function handleEditorInput() {
  updateCounters();
  letterModified = true;
  letterSentSuccessfully = false; // Reset if content is modified after sending
  // The CSS :empty::before handles placeholder visibility
}

function handlePaste(event) {
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
  handleEditorInput(); // Update counters and flags
}

function changeFont(font) {
  letterEditor.style.fontFamily = `'${font}', cursive`;
  letterModified = true;
}

function formatText(command) {
  letterEditor.focus(); // Ensure editor has focus
  let execCommandName = command;
  // For basic commands like bold, italic, underline, strikeThrough,
  // the command name is often the same for document.execCommand.
  // No specific mapping needed here if using standard commands.

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && selection.getRangeAt(0).toString().length > 0) {
      document.execCommand(execCommandName, false, null);
      letterModified = true;
      updateCounters();
  } else {
      showTemporaryMessage('💡 Select some text first, then click a formatting button!', 'info', 3000);
  }
}

function clearFormatting() {
  letterEditor.focus();
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && selection.getRangeAt(0).toString().length > 0) {
      document.execCommand('removeFormat', false, null);
      // For more granular control, to only remove b,i,u,s:
      // This would require getting selected HTML, stripping tags, and re-inserting.
      // For now, removeFormat is a simpler approach.
  } else {
      // Optionally, clear all formatting if nothing is selected.
      // This could be: letterEditor.innerHTML = letterEditor.textContent; (strips ALL HTML)
      // Or more targeted:
      // letterEditor.innerHTML = letterEditor.innerHTML.replace(/<\/?(b|i|u|s)>/gi, "");
      showTemporaryMessage('💡 Select text to clear its formatting.', 'info', 3000);
  }
  letterModified = true;
  updateCounters();
}

function updateCounters() {
  const text = letterEditor.textContent || ""; // Use textContent for accurate counts
  const charCount = text.length;
  const charCounter = document.getElementById('charCounter');
  charCounter.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;

  if (charCount < 50) charCounter.style.color = '#e74c3c'; // Keep original counter colors for now
  else if (charCount < 200) charCounter.style.color = '#f39c12';
  else charCounter.style.color = '#27ae60';

  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  document.getElementById('wordCounter').textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

async function exportAsImage() {
  const exportBtn = document.querySelector('.export-btn.image');
  const originalText = exportBtn.innerHTML;

  try {
    exportBtn.disabled = true;
    exportBtn.innerHTML = '⏳ Processing...';

    const canvas = await createLetterCanvas(true);

    const link = document.createElement('a');
    link.download = `letter-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();

    showTemporaryMessage('Image saved successfully! 🖼️', 'success');

  } catch (error) {
    console.error('Export as image failed:', error);
    showTemporaryMessage('Failed to export image. Please try again.', 'error');
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = originalText;
  }
}

async function exportAsPDF() {
  const exportBtn = document.querySelector('.export-btn.pdf');
  const originalText = exportBtn.innerHTML;

  try {
    exportBtn.disabled = true;
    exportBtn.innerHTML = '⏳ Processing...';

    const canvas = await createLetterCanvas(false);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const canvasAspectRatio = canvas.width / canvas.height;
    let imgHeight = imgWidth / canvasAspectRatio;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight; // Negative position for subsequent pages
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `letter-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    showTemporaryMessage('PDF saved successfully! 📄 (Long letters may span multiple pages)', 'success');

  } catch (error) {
    console.error('Export as PDF failed:', error);
    showTemporaryMessage('Failed to export PDF. Please try again.', 'error');
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = originalText;
  }
}

async function createLetterCanvas(isForPNG = false) {
  const letterHTMLContent = letterEditor.innerHTML; // Get HTML from contenteditable
  const letterStyle = window.getComputedStyle(letterEditor);
  const selectedFont = letterStyle.fontFamily || 'Patrick Hand';
  const senderName = document.getElementById('senderName').value;
  const exportFontSize = parseInt(document.getElementById('exportFontSize').value, 10) || 20;

  const canvas = document.getElementById('letterCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 794; // Standard A4-ish width in pixels (for 96 DPI)
  const defaultA4Height = 1123;

  if (isForPNG) {
      const tempDiv = document.createElement('div');
      tempDiv.style.width = (canvas.width - 160) + 'px'; // content width
      tempDiv.style.fontFamily = selectedFont; // Use computed font family
      tempDiv.style.fontSize = exportFontSize + 'px';
      // Use the same line height as the editor for height calculation
      // The editor's line-height is 1.5625 for 1.2rem font to match 30px lines.
      // For variable exportFontSize, we should calculate line height proportionally.
      // If editor line-height is 1.5625 * base_font_size, then for export:
      const editorBaseFontSize = parseFloat(letterStyle.fontSize); // e.g., 19.2px for 1.2rem
      const editorLineHeightRatio = parseFloat(letterStyle.lineHeight) / editorBaseFontSize; // e.g., 1.5625
      tempDiv.style.lineHeight = (exportFontSize * editorLineHeightRatio) + 'px';

      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.innerHTML = letterHTMLContent;
      document.body.appendChild(tempDiv);
      const contentHeight = tempDiv.scrollHeight;
      document.body.removeChild(tempDiv);

      const bottomPadding = exportFontSize * 6;
      canvas.height = Math.max(defaultA4Height, contentHeight + bottomPadding + 160 /* top/bottom margins */);
  } else {
      canvas.height = defaultA4Height;
  }

  // Use paper background color from CSS if possible, or default to the new one
  const paperElement = document.getElementById('letterPaper');
  const paperStyle = window.getComputedStyle(paperElement);
  ctx.fillStyle = paperStyle.backgroundColor || '#f9f5ef'; // Use actual paper color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawPaperBackground(ctx, canvas.width, canvas.height, exportFontSize, editorLineHeightRatio);

  const processedTextParts = processFormattedText(letterHTMLContent);

  ctx.fillStyle = window.getComputedStyle(letterEditor).color || '#4a3f35'; // Use editor text color
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  await drawFormattedText(ctx, processedTextParts, selectedFont, 80, 80, canvas.width - 160, canvas.height - (exportFontSize * 4), exportFontSize, editorLineHeightRatio);

  if (senderName.trim()) {
    ctx.font = `italic ${exportFontSize * 0.9}px ${selectedFont}`;
    ctx.fillStyle = window.getComputedStyle(letterEditor).color || '#4a3f35';
    const nameMetrics = ctx.measureText(`- ${senderName}`);
    const nameY = canvas.height - (exportFontSize * 3) - 20;
    const nameX = canvas.width - nameMetrics.width - 80;
    ctx.fillText(`- ${senderName}`, nameX, nameY);
  }

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.font = `${exportFontSize * 0.75}px ${selectedFont}`;
  ctx.fillStyle = '#8a7d70'; // Use a color that fits the theme
  ctx.fillText(date, 80, 40);

  return canvas;
}

function drawPaperBackground(ctx, width, height, exportFontSize, editorLineHeightRatio) {
  // Background color is already filled by createLetterCanvas

  // Ruled lines
  // Use the new paper line color from CSS if possible, or default
  // This is tricky as ::before pseudo-elements aren't easily readable by JS
  // We'll use the defined color directly.
  ctx.strokeStyle = 'rgba(180, 170, 160, 0.25)'; // Muted sepia/grey lines
  ctx.lineWidth = 1;
  
  // Calculate lineSpacing based on exportFontSize and the editor's line height ratio
  const lineSpacing = exportFontSize * editorLineHeightRatio;


  for (let y = 80 + lineSpacing; y < height - (lineSpacing * 1.5); y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(80, Math.round(y) + 0.5); // +0.5 for sharper lines
    ctx.lineTo(width - 80, Math.round(y) + 0.5);
    ctx.stroke();
  }

  // Vertical margin line
  ctx.strokeStyle = 'rgba(200, 100, 90, 0.35)'; // Dustier, softer red
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 60);
  ctx.lineTo(120, height - 60);
  ctx.stroke();
}

function processFormattedText(htmlText) {
  const parts = [];
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlText.replace(/\n/g, '<br>');

  function processNode(node, currentStyle) {
      if (node.nodeType === Node.TEXT_NODE) {
          if (node.nodeValue.trim() !== '' || node.nodeValue === ' ') {
               parts.push({ text: node.nodeValue, ...currentStyle });
          }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
          let style = { ...currentStyle };
          const tagName = node.tagName.toLowerCase();
          const computedStyle = window.getComputedStyle(node);

          if (tagName === 'b' || computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700) style.bold = true;
          if (tagName === 'i' || computedStyle.fontStyle === 'italic') style.italic = true;
          if (tagName === 'u' || computedStyle.textDecorationLine.includes('underline')) style.underline = true;
          if (tagName === 's' || computedStyle.textDecorationLine.includes('line-through')) style.strike = true;
          
          if (tagName === 'br') {
               parts.push({ text: '\n', ...currentStyle });
          } else {
            node.childNodes.forEach(child => processNode(child, style));
          }
      }
  }
  tempDiv.childNodes.forEach(child => processNode(child, { bold: false, italic: false, underline: false, strike: false }));
  return parts;
}


async function drawFormattedText(ctx, textParts, fontFamily, x, y, maxWidth, drawingMaxHeight, exportFontSize = 20, editorLineHeightRatio) {
  const fontSize = parseInt(exportFontSize, 10);
  const lineHeight = fontSize * editorLineHeightRatio; // Use calculated line height
  let currentX = x;
  let currentY = y + fontSize * 0.8; // Adjust baseline slightly for 'top' and typical font rendering

  const defaultTextColor = window.getComputedStyle(letterEditor).color || '#4a3f35';

  for (const part of textParts) {
    if (currentY + lineHeight > drawingMaxHeight + y) { break; }

    const lines = part.text.split('\n');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineContent = lines[lineIndex];
      if (lineIndex > 0) {
        currentY += lineHeight;
        currentX = x;
      }
      if (currentY > drawingMaxHeight + y - fontSize ) { break; }

      const words = lineContent.split(/(\s+)/);

      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        const word = words[wordIndex];
        if (word === "") continue;

        let fontStyle = '';
        if (part.italic) fontStyle += 'italic ';
        if (part.bold) fontStyle += 'bold ';
        ctx.font = `${fontStyle}${fontSize}px ${fontFamily}`; // fontFamily already includes quotes if needed

        const wordMetrics = ctx.measureText(word);

        if (currentX + wordMetrics.width > x + maxWidth && currentX > x) {
          currentY += lineHeight;
          currentX = x;
          if (currentY > drawingMaxHeight + y - fontSize) { break; }
        }

        ctx.fillStyle = defaultTextColor;
        ctx.fillText(word, currentX, currentY);

        const textBottomY = currentY + (fontSize * 0.2); // Approximation
        const textMiddleY = currentY - (fontSize * 0.3); // Approximation for strikethrough

        if (part.underline) {
          ctx.strokeStyle = defaultTextColor;
          ctx.lineWidth = Math.max(1, fontSize / 18);
          ctx.beginPath();
          ctx.moveTo(currentX, textBottomY);
          ctx.lineTo(currentX + wordMetrics.width, textBottomY);
          ctx.stroke();
        }
        if (part.strike) {
          ctx.strokeStyle = defaultTextColor;
          ctx.lineWidth = Math.max(1, fontSize / 18);
          ctx.beginPath();
          ctx.moveTo(currentX, textMiddleY);
          ctx.lineTo(currentX + wordMetrics.width, textMiddleY);
          ctx.stroke();
        }
        currentX += wordMetrics.width;
      }
      if (currentY > drawingMaxHeight + y - fontSize) break;
    }
    if (currentY > drawingMaxHeight + y - fontSize) break;
  }
}


function showTemporaryMessage(message, type = 'info', duration = 3000) {
  const notificationArea = (type === 'success' || type === 'error') ? document.getElementById('successMessage') : document.getElementById('infoMessage');

  if (type === 'success') {
      notificationArea.className = 'success-message';
      notificationArea.style.background = ''; // Uses CSS class
  } else if (type === 'error') {
      notificationArea.className = 'info-message'; // Use info-message class for structure
      notificationArea.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)'; // Error color
  } else { // 'info'
      notificationArea.className = 'info-message';
      notificationArea.style.background = ''; // Uses CSS class
  }

  notificationArea.innerHTML = message;
  notificationArea.classList.remove('hidden');
  notificationArea.style.animation = 'fadeInDown 0.5s ease-out forwards';

  setTimeout(() => {
    notificationArea.style.animation = 'fadeInUp 0.5s ease-out reverse forwards';
    setTimeout(() => {
      notificationArea.classList.add('hidden');
      notificationArea.style.animation = '';
      if (type === 'error') { // Reset background for error only if it was changed
          notificationArea.style.background = '';
      }
    }, 500);
  }, duration);
}

function handleSubmit(event) {
  event.preventDefault();
  letterSentSuccessfully = false;

  const submitButton = event.target.closest('button[type="submit"]');
  const letterHTML = letterEditor.innerHTML;
  const letterText = letterEditor.textContent.trim();

  if (letterText.length < 10) {
      showTemporaryMessage('⚠️ Please write a longer letter (at least 10 characters).', 'error', 3000);
      return;
  }

  submitButton.disabled = true;
  submitButton.innerHTML = '📤 Sending...';
  submitButton.style.background = 'linear-gradient(145deg, #95a5a6, #7f8c8d)'; // Sending style

  const templateParams = {
      name: document.getElementById('senderName').value || "An anonymous penpal",
      reply: document.getElementById('recipientInfo').value || "No reply address provided",
      letter: letterHTML
  };

  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(function(response) {
         console.log('SUCCESS!', response.status, response.text);
         showTemporaryMessage('✨ Your heartfelt letter has been sent directly to me! 💕', 'success', 5000);
         letterModified = false;
         letterSentSuccessfully = true;
         localStorage.removeItem('letterDraft');
         document.getElementById('letterForm').reset();
         letterEditor.innerHTML = '';
         updateCounters();
      }, function(error) {
         console.log('FAILED...', error);
         showTemporaryMessage('😞 Something went wrong. Please try sending again.', 'error', 5000);
      })
      .finally(function() {
          submitButton.disabled = false;
          submitButton.innerHTML = '📮 Send Another Letter';
          submitButton.style.background = ''; // Reset to CSS gradient
      });
}

function saveDraft() {
  const draft = {
      letter: letterEditor.innerHTML,
      font: letterEditor.style.fontFamily || document.getElementById('font').value,
      senderName: document.getElementById('senderName').value,
      recipientInfo: document.getElementById('recipientInfo').value,
      timestamp: new Date().toISOString()
  };
  localStorage.setItem('letterDraft', JSON.stringify(draft));
  letterModified = false;
  showTemporaryMessage('💾 Draft saved successfully!', 'info', 2000);
}

function loadDraft() {
  const savedDraft = localStorage.getItem('letterDraft');
  if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      letterEditor.innerHTML = draft.letter;
      const draftFont = draft.font || 'Patrick Hand';
      document.getElementById('font').value = draftFont;
      changeFont(draftFont);

      document.getElementById('senderName').value = draft.senderName || '';
      document.getElementById('recipientInfo').value = draft.recipientInfo || '';

      updateCounters();
      letterModified = false;
      const saveDate = new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      showTemporaryMessage(`🧾 Draft from ${saveDate} loaded!`, 'info', 3000);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadDraft();
  updateCounters();
  // Apply initial font from dropdown, or default from CSS if not set by draft
  const initialFontFamily = document.getElementById('font').value || window.getComputedStyle(letterEditor).fontFamily;
  if (initialFontFamily) {
    // Ensure the font value is one of the select options if it's a complex string
    const fontSelect = document.getElementById('font');
    let foundInSelect = false;
    for (let i = 0; i < fontSelect.options.length; i++) {
        if (initialFontFamily.includes(fontSelect.options[i].value)) {
            fontSelect.value = fontSelect.options[i].value;
            changeFont(fontSelect.options[i].value);
            foundInSelect = true;
            break;
        }
    }
    if (!foundInSelect) { // Fallback if font from CSS isn't in select
        changeFont(fontSelect.value);
    }
  }


});

window.addEventListener('beforeunload', function (e) {
  if (letterModified && !letterSentSuccessfully) {
    const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
    e.returnValue = confirmationMessage;
    return confirmationMessage;
  }
});
