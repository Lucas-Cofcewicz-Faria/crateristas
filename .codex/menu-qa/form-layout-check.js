(() => {
  const panels = [...document.querySelectorAll('section')].filter((node) => node.querySelector('#menu-item-name, #menu-photo-title'));
  const problems = [];
  if (!panels.length) problems.push('Formulário ou etapa de fotos não encontrado.');
  if (panels.some((node) => parseFloat(getComputedStyle(node).borderBottomWidth) > 0)) problems.push('Linha solta abaixo do formulário/fotos.');
  if (document.documentElement.scrollWidth > innerWidth) problems.push('Página com overflow horizontal.');
  if (innerWidth <= 767) {
    const button = [...document.querySelectorAll('button')].find((node) => /Criar prato|Concluir e ver prato/.test(node.textContent));
    if (button && Math.abs(button.getBoundingClientRect().width - button.parentElement.getBoundingClientRect().width) > 2) problems.push('Botão principal não ocupa a largura disponível no mobile.');
  }
  const name = document.querySelector('#menu-item-name');
  if (name) {
    const nameBox = name.getBoundingClientRect();
    const priceBox = document.querySelector('#menu-item-price').getBoundingClientRect();
    const descriptionBox = document.querySelector('#menu-item-description').getBoundingClientRect();
    const scores = ['flavor', 'value', 'ux'].map((key) => document.querySelector(`#menu-score-${key}`).closest('[data-score-unit]').getBoundingClientRect());
    if (innerWidth > 767) {
      if (Math.abs(nameBox.top - priceBox.top) > 2) problems.push('Nome e preço desalinhados no desktop.');
      if (scores.some((box) => Math.abs(box.top - scores[0].top) > 2)) problems.push('As três notas não estão na mesma linha.');
    } else {
      if (!(nameBox.top < priceBox.top && priceBox.top < descriptionBox.top)) problems.push('Ordem dos campos incorreta no mobile.');
      if (!(scores[0].top < scores[1].top && scores[1].top < scores[2].top)) problems.push('Notas não estão empilhadas no mobile.');
    }
  }
  if (problems.length) throw new Error(problems.join(' '));
  return { result: 'PASS', viewport: innerWidth, state: name ? 'form' : 'photos', bottomBorders: panels.map((node) => getComputedStyle(node).borderBottomWidth) };
})()
