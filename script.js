// script.js
document.addEventListener('DOMContentLoaded', function() {
    const letterEditor = document.getElementById('letterEditor');
    const formattingButtons = document.querySelector('.formatting-buttons');
    const fontControls = document.querySelector('.font-controls');

    const exportFontSizeLabelForAnchor = fontControls ? fontControls.querySelector('label[for="exportFontSize"]') : null;

    let letterModified = false;
    let letterSentSuccessfully = false;

    // function updateBodyPadding() { /* NO LONGER NEEDED for fixed bottom bar */ }

    function setupFormattingControls() {
        const isMobileView = window.innerWidth < 768;

        if (isMobileView) {
            // Floating formatting buttons logic
            if (formattingButtons.parentElement !== document.body) {
                document.body.appendChild(formattingButtons);
            }
            formattingButtons.style.position = 'absolute';
            formattingButtons.style.zIndex = '1001';
            formattingButtons.classList.add('floating');
            formattingButtons.style.display = 'none'; 

            document.removeEventListener('selectionchange', handleFloatingToolbar);
            document.addEventListener('selectionchange', handleFloatingToolbar);
            letterEditor.removeEventListener('blur', hideFloatingToolbarOnBlur, true);
            letterEditor.addEventListener('blur', hideFloatingToolbarOnBlur, true);
            formattingButtons.removeEventListener('mousedown', preventBlurOnToolbarClick);
            formattingButtons.addEventListener('mousedown', preventBlurOnToolbarClick);

            // Ensure .font-controls itself is not display:none from other rules if it's sticky
            if (fontControls) {
                fontControls.style.display = ''; // Should be 'flex' from its own sticky CSS
            }

        } else { // Desktop view
            if (formattingButtons.parentElement === document.body) {
                if (exportFontSizeLabelForAnchor && exportFontSizeLabelForAnchor.parentElement === fontControls) {
                    fontControls.insertBefore(formattingButtons, exportFontSizeLabelForAnchor);
                } else {
                    if (fontControls) fontControls.appendChild(formattingButtons);
                }
            }
            formattingButtons.style.position = '';
            formattingButtons.style.zIndex = '';
            formattingButtons.classList.remove('floating');
            formattingButtons.style.display = ''; 
            formattingButtons.style.top = '';
            formattingButtons.style.left = '';

            document.removeEventListener('selectionchange', handleFloatingToolbar);
            letterEditor.removeEventListener('blur', hideFloatingToolbarOnBlur, true);
            formattingButtons.removeEventListener('mousedown', preventBlurOnToolbarClick);
        }
        // updateBodyPadding(); // REMOVE THIS CALL
    }

    function handleFloatingToolbar() {
        if (window.innerWidth >= 768) {
            if (formattingButtons.classList.contains('floating')) {
                 formattingButtons.style.display = 'none';
            }
            return;
        }

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed && letterEditor.contains(selection.anchorNode) && selection.toString().trim() !== '') {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            formattingButtons.style.display = 'flex';

            let barHeight = formattingButtons.offsetHeight;
            let barWidth = formattingButtons.offsetWidth;

            if (barHeight === 0 || barWidth === 0) {
                formattingButtons.style.display = 'none';
                return;
            }

            let top = window.scrollY + rect.top - barHeight - 8; 
            let left = window.scrollX + rect.left + (rect.width / 2) - (barWidth / 2);

            // Boundary checks
            if (top < window.scrollY + 5) { // If too close to top of viewport (e.g. under sticky header)
                top = window.scrollY + rect.bottom + 8;
            }
            // Sticky header adjustment (if you have one, and .font-controls is NOT that header)
            const stickyControls = document.querySelector('.font-controls');
            let stickyHeaderHeight = 0;
            if (stickyControls && getComputedStyle(stickyControls).position === 'sticky' && parseFloat(getComputedStyle(stickyControls).top) === 0) {
                stickyHeaderHeight = stickyControls.offsetHeight;
            }
            if (top < window.scrollY + stickyHeaderHeight + 5 && rect.top > stickyHeaderHeight) { // Don't position under sticky header if selection below it
                top = window.scrollY + rect.bottom + 8;
            }


            if (left < window.scrollX + 5) left = window.scrollX + 5;
            if (left + barWidth > window.scrollX + window.innerWidth - 5) {
                left = window.scrollX + window.innerWidth - barWidth - 5;
            }
            
            // Ensure it doesn't go off bottom of screen
            if (top + barHeight > window.scrollY + window.innerHeight - 5) {
                top = window.scrollY + window.innerHeight - barHeight - 5;
                 // Try to reposition above if it was forced below and now too low
                if (rect.top - barHeight - 8 > window.scrollY + 5) { 
                    top = window.scrollY + rect.top - barHeight - 8;
                }
            }
            if (top < window.scrollY + 5) top = window.scrollY + 5;


            formattingButtons.style.top = `${top}px`;
            formattingButtons.style.left = `${left}px`;
        } else {
            if (document.activeElement !== letterEditor && !formattingButtons.contains(document.activeElement)) {
                 formattingButtons.style.display = 'none';
            }
        }
    }

    function hideFloatingToolbarOnBlur(event) {
        const relatedTarget = event.relatedTarget;
        if (formattingButtons.contains(relatedTarget)) {
            return;
        }
        setTimeout(() => {
            if (!formattingButtons.contains(document.activeElement)) {
                formattingButtons.style.display = 'none';
            }
        }, 100);
    }

    function preventBlurOnToolbarClick(event) {
        event.preventDefault();
    }


    function handleEditorInput() {
      updateCounters();
      letterModified = true;
      letterSentSuccessfully = false;
    }

    function handlePaste(event) {
      event.preventDefault();
      const text = (event.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
      handleEditorInput();
    }

    function changeFont(font) {
      if (letterEditor) letterEditor.style.fontFamily = `'${font}', cursive`;
      letterModified = true;
    }

    function formatText(command) {
      if (!letterEditor) return;
      letterEditor.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.getRangeAt(0).toString().length > 0) {
          document.execCommand(command, false, null);
          letterModified = true;
          updateCounters();
      } else if (window.innerWidth >= 768) { // Only show message on desktop if no selection
          showTemporaryMessage('💡 Select some text first, then click a formatting button!', 'info', 3000);
      }
    }

    function clearFormatting() {
      if (!letterEditor) return;
      letterEditor.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.getRangeAt(0).toString().length > 0) {
          document.execCommand('removeFormat', false, null);
      } else {
          showTemporaryMessage('💡 Select text to clear its formatting.', 'info', 3000);
      }
      letterModified = true;
      updateCounters();
    }

    function updateCounters() {
      if (!letterEditor) return;
      const text = letterEditor.textContent || "";
      const charCount = text.length;
      const charCounter = document.getElementById('charCounter');
      if (charCounter) {
        charCounter.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;
        if (charCount < 50) charCounter.style.color = '#e74c3c';
        else if (charCount < 200) charCounter.style.color = '#f39c12';
        else charCounter.style.color = '#27ae60';
      }

      const wordCounter = document.getElementById('wordCounter');
      if (wordCounter) {
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        wordCounter.textContent = `${words} word${words !== 1 ? 's' : ''}`;
      }
    }

    async function exportAsImage() {
      const exportBtn = document.querySelector('.export-btn.image');
      if (!exportBtn) return;
      const originalText = exportBtn.innerHTML;
      try {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '⏳ Processing...';
        const canvas = await createLetterCanvas(true);
        if (!canvas) throw new Error("Canvas creation failed");
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
      if (!exportBtn) return;
      const originalText = exportBtn.innerHTML;
      try {
        exportBtn.disabled = true;
        exportBtn.innerHTML = '⏳ Processing...';
        const canvas = await createLetterCanvas(false);
        if (!canvas) throw new Error("Canvas creation failed");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const pageHeight = 297;
        const canvasAspectRatio = canvas.width / canvas.height;
        let imgHeight = imgWidth / canvasAspectRatio;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position -= pageHeight;
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
      if (!letterEditor) return null;
      const letterHTMLContent = letterEditor.innerHTML;
      const letterStyle = window.getComputedStyle(letterEditor);
      const selectedFont = letterStyle.fontFamily || 'Patrick Hand';
      const senderName = document.getElementById('senderName').value;
      const exportFontSizeSelect = document.getElementById('exportFontSize');
      const exportFontSize = exportFontSizeSelect ? parseInt(exportFontSizeSelect.value, 10) : 20;

      const canvas = document.getElementById('letterCanvas');
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      canvas.width = 794;
      const defaultA4Height = 1123;
      let editorLineHeightRatio = 1.5625; // Default fallback

      if (letterStyle.fontSize && letterStyle.lineHeight && parseFloat(letterStyle.fontSize) > 0) {
          const editorBaseFontSize = parseFloat(letterStyle.fontSize);
          if (parseFloat(letterStyle.lineHeight) > 0) { // Check if lineHeight is a measurable pixel value
             editorLineHeightRatio = parseFloat(letterStyle.lineHeight) / editorBaseFontSize;
          } else if (letterStyle.lineHeight === 'normal' && editorBaseFontSize > 0) {
             // Estimate 'normal' line height if possible, or use default.
             // This is browser-dependent, often around 1.2 to 1.5.
             // For hand-writing fonts, a bit more might be good.
             editorLineHeightRatio = 1.5; // Adjusted default for 'normal'
          }
      }


      if (isForPNG) {
          const tempDiv = document.createElement('div');
          tempDiv.style.width = (canvas.width - 160) + 'px';
          tempDiv.style.fontFamily = selectedFont;
          tempDiv.style.fontSize = exportFontSize + 'px';
          tempDiv.style.lineHeight = (exportFontSize * editorLineHeightRatio) + 'px';
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px'; // Move off-screen
          tempDiv.style.visibility = 'hidden'; // Ensure it's not visible
          tempDiv.innerHTML = letterHTMLContent;
          document.body.appendChild(tempDiv);
          const contentHeight = tempDiv.scrollHeight;
          document.body.removeChild(tempDiv);
          const bottomPadding = exportFontSize * 6;
          canvas.height = Math.max(defaultA4Height, contentHeight + bottomPadding + 160);
      } else {
          canvas.height = defaultA4Height;
      }
      const paperElement = document.getElementById('letterPaper');
      const paperStyle = paperElement ? window.getComputedStyle(paperElement) : null;
      ctx.fillStyle = paperStyle ? paperStyle.backgroundColor : '#f9f5ef'; // Fallback color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawPaperBackground(ctx, canvas.width, canvas.height, exportFontSize, editorLineHeightRatio);
      const processedTextParts = processFormattedText(letterHTMLContent);
      ctx.fillStyle = letterStyle.color || '#4a3f35';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      await drawFormattedText(ctx, processedTextParts, selectedFont, 80, 80, canvas.width - 160, canvas.height - (exportFontSize * 4), exportFontSize, editorLineHeightRatio);
      if (senderName.trim()) {
        ctx.font = `italic ${exportFontSize * 0.9}px ${selectedFont}`;
        ctx.fillStyle = letterStyle.color || '#4a3f35';
        const nameMetrics = ctx.measureText(`- ${senderName}`);
        const nameY = canvas.height - (exportFontSize * 3) - 20;
        const nameX = canvas.width - nameMetrics.width - 80;
        ctx.fillText(`- ${senderName}`, nameX, nameY);
      }
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      ctx.font = `${exportFontSize * 0.75}px ${selectedFont}`;
      ctx.fillStyle = '#8a7d70';
      ctx.fillText(date, 80, 40);
      return canvas;
    }

    function drawPaperBackground(ctx, width, height, exportFontSize, editorLineHeightRatio) {
      ctx.strokeStyle = 'rgba(180, 170, 160, 0.25)';
      ctx.lineWidth = 1;
      const lineSpacing = exportFontSize * editorLineHeightRatio;
      if (lineSpacing > 0) { // Ensure lineSpacing is valid
        for (let y = 80 + lineSpacing; y < height - (lineSpacing * 1.5); y += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(80, Math.round(y) + 0.5);
            ctx.lineTo(width - 80, Math.round(y) + 0.5);
            ctx.stroke();
        }
      }
      ctx.strokeStyle = 'rgba(200, 100, 90, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 60);
      ctx.lineTo(120, height - 60);
      ctx.stroke();
    }

    function processFormattedText(htmlText) {
      const parts = [];
      const tempDiv = document.createElement('div');
      // Ensure htmlText is a string before using replace
      const cleanHtmlText = (typeof htmlText === 'string') ? htmlText.replace(/\n/g, '<br>') : '';
      tempDiv.innerHTML = cleanHtmlText;

      function processNode(node, currentStyle) {
          if (node.nodeType === Node.TEXT_NODE) {
              // Only push if nodeValue is not entirely whitespace, or it's a single space (for spacing between words)
              if (node.nodeValue && (node.nodeValue.trim() !== '' || node.nodeValue === ' ')) {
                   parts.push({ text: node.nodeValue, ...currentStyle });
              }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
              let style = { ...currentStyle };
              const tagName = node.tagName.toLowerCase();
              // Get computed style from the tempDiv's context, not the main document
              // However, for b,i,u,s tags, their tagName is usually enough.
              // If relying on computedStyle, ensure node is attached to DOM or styled appropriately.
              // For simplicity, we rely on tags or direct style attributes if they were set.
              if (tagName === 'b' || node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight) >= 700) style.bold = true;
              if (tagName === 'i' || node.style.fontStyle === 'italic') style.italic = true;
              if (tagName === 'u' || (node.style.textDecoration && node.style.textDecoration.includes('underline'))) style.underline = true;
              if (tagName === 's' || (node.style.textDecoration && node.style.textDecoration.includes('line-through'))) style.strike = true;
              
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
      const lineHeight = fontSize * editorLineHeightRatio;
      if (!(lineHeight > 0)) return; // Prevent drawing if lineHeight is invalid

      let currentX = x;
      let currentY = y + fontSize * 0.8; // Adjust baseline slightly for 'top'
      const defaultTextColor = (letterEditor && window.getComputedStyle(letterEditor).color) ? window.getComputedStyle(letterEditor).color : '#4a3f35';

      for (const part of textParts) {
        if (currentY + lineHeight > drawingMaxHeight + y) { break; } // Content exceeds drawing area
        const lines = (typeof part.text === 'string') ? part.text.split('\n') : ['']; // Ensure part.text is string
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const lineContent = lines[lineIndex];
          if (lineIndex > 0) { // New line
            currentY += lineHeight;
            currentX = x;
          }
          if (currentY > drawingMaxHeight + y - fontSize ) { break; } // Line exceeds drawing area

          const words = lineContent.split(/(\s+)/); // Split by space, keeping spaces

          for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            const word = words[wordIndex];
            if (word === "") continue;

            let fontStyle = '';
            if (part.italic) fontStyle += 'italic ';
            if (part.bold) fontStyle += 'bold ';
            ctx.font = `${fontStyle}${fontSize}px ${fontFamily}`;

            const wordMetrics = ctx.measureText(word);

            if (currentX + wordMetrics.width > x + maxWidth && currentX > x) { // Word wrap
              currentY += lineHeight;
              currentX = x;
              if (currentY > drawingMaxHeight + y - fontSize) { break; } // Line exceeds drawing area
            }

            ctx.fillStyle = defaultTextColor;
            ctx.fillText(word, currentX, currentY);

            // Underline and Strikethrough positioning
            const textMetrics = ctx.measureText("M"); // Get general font metrics
            const actualAscent = textMetrics.actualBoundingBoxAscent || fontSize * 0.8;
            const actualDescent = textMetrics.actualBoundingBoxDescent || fontSize * 0.2;
            
            const underlineY = currentY + actualAscent + Math.max(1, fontSize / 20); // Below baseline
            const strikeY = currentY + actualAscent / 2; // Middle of the text

            if (part.underline) {
              ctx.strokeStyle = defaultTextColor;
              ctx.lineWidth = Math.max(1, fontSize / 18);
              ctx.beginPath();
              ctx.moveTo(currentX, underlineY);
              ctx.lineTo(currentX + wordMetrics.width, underlineY);
              ctx.stroke();
            }
            if (part.strike) {
              ctx.strokeStyle = defaultTextColor;
              ctx.lineWidth = Math.max(1, fontSize / 18);
              ctx.beginPath();
              ctx.moveTo(currentX, strikeY);
              ctx.lineTo(currentX + wordMetrics.width, strikeY);
              ctx.stroke();
            }
            currentX += wordMetrics.width;
          }
          if (currentY > drawingMaxHeight + y - fontSize) break; // Line exceeds drawing area (inner loop)
        }
        if (currentY > drawingMaxHeight + y - fontSize) break; // Line exceeds drawing area (outer loop)
      }
    }

    function showTemporaryMessage(message, type = 'info', duration = 3000) {
      const notificationArea = (type === 'success' || type === 'error') ? document.getElementById('successMessage') : document.getElementById('infoMessage');
      if (!notificationArea) return;

      if (type === 'success') {
          notificationArea.className = 'success-message';
          notificationArea.style.background = '';
      } else if (type === 'error') {
          notificationArea.className = 'info-message'; // Use info-message class for structure
          notificationArea.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)';
      } else { // 'info'
          notificationArea.className = 'info-message';
          notificationArea.style.background = '';
      }

      notificationArea.innerHTML = message;
      notificationArea.classList.remove('hidden');
      notificationArea.style.animation = 'fadeInDown 0.5s ease-out forwards';

      setTimeout(() => {
        notificationArea.style.animation = 'fadeInUp 0.5s ease-out reverse forwards';
        setTimeout(() => {
          notificationArea.classList.add('hidden');
          notificationArea.style.animation = '';
          if (type === 'error') {
              notificationArea.style.background = '';
          }
        }, 500);
      }, duration);
    }

    function handleSubmit(event) {
      event.preventDefault();
      letterSentSuccessfully = false;
      const submitButton = event.target.closest('button[type="submit"]');
      if (!letterEditor || !submitButton) return;

      const letterText = letterEditor.textContent.trim();
      if (letterText.length < 10) {
          showTemporaryMessage('⚠️ Please write a longer letter (at least 10 characters).', 'error', 3000);
          return;
      }
      submitButton.disabled = true;
      submitButton.innerHTML = '📤 Sending...';
      submitButton.style.background = 'linear-gradient(145deg, #95a5a6, #7f8c8d)';
      const templateParams = {
          name: document.getElementById('senderName').value || "An anonymous penpal",
          reply: document.getElementById('recipientInfo').value || "No reply address provided",
          letter: letterEditor.innerHTML
      };
      // Ensure EmailJS is loaded
      if (typeof emailjs === 'undefined') {
          showTemporaryMessage('😞 Email service is not available. Please try again later.', 'error', 5000);
          submitButton.disabled = false;
          submitButton.innerHTML = '📮 Send Another Letter';
          submitButton.style.background = '';
          return;
      }
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          .then(function(response) {
             console.log('SUCCESS!', response.status, response.text);
             showTemporaryMessage('✨ Your heartfelt letter has been sent directly to me! 💕', 'success', 5000);
             letterModified = false;
             letterSentSuccessfully = true;
             localStorage.removeItem('letterDraft');
             if (document.getElementById('letterForm')) document.getElementById('letterForm').reset();
             letterEditor.innerHTML = '';
             updateCounters();
          }, function(error) {
             console.log('FAILED...', error);
             showTemporaryMessage('😞 Something went wrong. Please try sending again.', 'error', 5000);
          })
          .finally(function() {
              submitButton.disabled = false;
              submitButton.innerHTML = '📮 Send Another Letter';
              submitButton.style.background = '';
          });
    }

    function saveDraft() {
      if (!letterEditor) return;
      const draft = {
          letter: letterEditor.innerHTML,
          font: letterEditor.style.fontFamily || (document.getElementById('font') ? document.getElementById('font').value : 'Patrick Hand'),
          senderName: document.getElementById('senderName') ? document.getElementById('senderName').value : '',
          recipientInfo: document.getElementById('recipientInfo') ? document.getElementById('recipientInfo').value : '',
          timestamp: new Date().toISOString()
      };
      localStorage.setItem('letterDraft', JSON.stringify(draft));
      letterModified = false;
      showTemporaryMessage('💾 Draft saved successfully!', 'info', 2000);
    }

    function loadDraft() {
      if (!letterEditor) return;
      const savedDraft = localStorage.getItem('letterDraft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          letterEditor.innerHTML = draft.letter || ''; // Ensure it's at least an empty string
          const fontSelect = document.getElementById('font');
          const draftFont = draft.font || 'Patrick Hand';
          if (fontSelect) fontSelect.value = draftFont;
          changeFont(draftFont);

          const senderNameEl = document.getElementById('senderName');
          if (senderNameEl) senderNameEl.value = draft.senderName || '';
          const recipientInfoEl = document.getElementById('recipientInfo');
          if (recipientInfoEl) recipientInfoEl.value = draft.recipientInfo || '';

          updateCounters();
          letterModified = false;
          const saveDate = new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          showTemporaryMessage(`🧾 Draft from ${saveDate} loaded!`, 'info', 3000);
        } catch (e) {
          console.error("Failed to parse draft from localStorage", e);
          localStorage.removeItem('letterDraft'); // Clear corrupted draft
        }
      }
    }

    // Initial setup calls
    if (letterEditor) { 
        loadDraft();
        updateCounters();
        const fontSelect = document.getElementById('font');
        // Simplified initial font logic - ensure this part is robust from your working version
        const initialFontToApply = (fontSelect ? fontSelect.value : null) || 
                                 (window.getComputedStyle(letterEditor).fontFamily) || 
                                 'Patrick Hand';
        changeFont(initialFontToApply.split(',')[0].replace(/"/g,'').trim());
    }

    if (formattingButtons && fontControls && letterEditor) { 
        setupFormattingControls();
        window.addEventListener('resize', setupFormattingControls);
        // window.addEventListener('resize', updateBodyPadding); // REMOVE THIS LINE
    } else {
        console.error("One or more key elements for UI setup are missing: font-controls, formatting-buttons, or letter-editor.");
    }

    window.addEventListener('beforeunload', function (e) {
      if (letterModified && !letterSentSuccessfully) {
        const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = confirmationMessage; 
        return confirmationMessage; 
      }
    });

    window.handleEditorInput = handleEditorInput;
    window.handlePaste = handlePaste;
    window.changeFont = changeFont;
    window.formatText = formatText;
    window.clearFormatting = clearFormatting;
    window.exportAsImage = exportAsImage;
    window.exportAsPDF = exportAsPDF;
    window.saveDraft = saveDraft;
    window.handleSubmit = handleSubmit;

    // PASTE THE REST OF YOUR ORIGINAL WORKING SCRIPT.JS FUNCTIONS HERE
    // (createLetterCanvas, drawPaperBackground, processFormattedText, etc.)
    // Ensure all functions are defined. For example:
    // function handleEditorInput() { ... }
    // ... all other functions from your previous script ...
});
