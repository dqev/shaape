export function showToast(message: string): void {
  if (typeof document === 'undefined') return;
  const toastEl = document.getElementById('toastNotification');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('active');

  const existingTimer = (toastEl as any)._timer;
  if (existingTimer) clearTimeout(existingTimer);

  (toastEl as any)._timer = setTimeout(() => {
    toastEl.classList.remove('active');
  }, 2000);
}

export function copyTextToClipboard(
  text: string,
  successMsg: string = 'Copied to clipboard!',
  triggerBtn?: HTMLElement | null
): void {
  let copied = false;
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '-9999px';
    el.style.width = '2em';
    el.style.height = '2em';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, text.length);
    copied = document.execCommand('copy');
    document.body.removeChild(el);
  } catch (e) {
    copied = false;
  }

  const onCopied = () => {
    showToast(successMsg);
    if (triggerBtn) {
      triggerBtn.classList.add('active');
      const originalHtml = triggerBtn.innerHTML;
      triggerBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      setTimeout(() => {
        triggerBtn.classList.remove('active');
        triggerBtn.innerHTML = originalHtml;
      }, 1400);
    }
  };

  if (copied) {
    onCopied();
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(onCopied)
      .catch(onCopied);
  } else {
    onCopied();
  }
}

export async function copySvgToClipboard(
  svgString: string,
  successMsg: string = 'Copied SVG code!',
  triggerBtn?: HTMLElement | null
): Promise<void> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof ClipboardItem !== 'undefined'
  ) {
    try {
      const textBlob = new Blob([svgString], { type: 'text/plain' });
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': textBlob,
          'image/svg+xml': svgBlob,
        }),
      ]);
      showToast(successMsg);
      if (triggerBtn) {
        triggerBtn.classList.add('active');
        const originalHtml = triggerBtn.innerHTML;
        triggerBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        setTimeout(() => {
          triggerBtn.classList.remove('active');
          triggerBtn.innerHTML = originalHtml;
        }, 1400);
      }
      return;
    } catch {
      // Fall back to standard text clipboard
    }
  }

  copyTextToClipboard(svgString, successMsg, triggerBtn);
}
