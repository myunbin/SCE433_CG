
const axis = ['X', 'Y', 'Z'];
const axisIdx = {
  X: 0,
  Y: 1,
  Z: 2,
};

const elemMapper = {};
var sltd = null;
var createNodeType = 'cube';

function renderDone() {
  Object.keys(renderObj.data).forEach((k) => {
    if (k === 'info') return;
    const elem = document.getElementById(k);
    elem.style.left = `${renderObj.data[k].calcedCoord[0]}px`;
    elem.style.top = `${renderObj.data[k].calcedCoord[1]}px`;
  });
  if (sltd) {
    axis.forEach(i => {
      const idx = axisIdx[i];
      if (renderObj.data[sltd].rotateSpd[idx] !== 0) {
        elemMapper[`rot${i}D-N`].value = renderObj.data[sltd].rotate[idx].toFixed(2);
      }
      if (renderObj.data[sltd].rotateNodeSpd[idx] !== 0) {
        elemMapper[`rot${i}DN-N`].value = renderObj.data[sltd].rotateNode[idx].toFixed(2);
      }
    });
  }
}

function selectNode(k) {
  const ctrlPanel = document.getElementById('ctrl-panel');
  const sltdName = document.getElementById('sltd-name');
  if (k === null) {
    sltd = null;
    ctrlPanel.style.display = 'none';
    return;
  }
  if (sltd) {
    renderObj.data[sltd].color = [0, 1, 0, 1];
    if (sltd === k) {
      sltd = null;
      ctrlPanel.style.display = 'none';
      return;
    }
  }
  renderObj.data[k].color = [1, 0, 0, 1];
  sltd = k;
  const removeBtn = document.getElementById('remove-btn');
  if (k === 'root') {
    removeBtn.textContent = 'root node cannot be removed';
    removeBtn.disabled = true;
  } else {
    removeBtn.textContent = 'remove node';
    removeBtn.disabled = false;
  }
  // data setting for selected renderObj.data
  axis.forEach(i => {
    const idx = axisIdx[i];
    elemMapper[`rot${i}S-N`].value = renderObj.data[k].rotateSpd[idx].toString();
    elemMapper[`rot${i}S-SPD`].value = renderObj.data[k].rotateSpd[idx].toFixed(2);
    elemMapper[`rot${i}SN-N`].value = renderObj.data[k].rotateNodeSpd[idx].toString();
    elemMapper[`rot${i}SN-SPD`].value = renderObj.data[k].rotateNodeSpd[idx].toFixed(2)

    elemMapper[`rot${i}D-N`].value = renderObj.data[k].rotate[idx].toFixed(2)
    elemMapper[`rot${i}DN-N`].value = renderObj.data[k].rotateNode[idx].toFixed(2)

    elemMapper[`tr${i}D-N`].value = renderObj.data[k].translate[idx].toString();
    elemMapper[`sc${i}D-N`].value = renderObj.data[k].scale[idx].toString();
  });
  ctrlPanel.style.display = 'block';
  sltdName.textContent = k;
  const cdiv = document.getElementById('children');
  while (cdiv.firstChild) cdiv.removeChild(cdiv.firstChild);
  renderObj.data[k].children.forEach((c) => {
    const elem = document.createElement('button');
    elem.textContent = c;
    elem.onclick = () => selectNode(c);
    cdiv.appendChild(elem);
  });
}

window.addEventListener('load', () => {
  const fingerCtrl = document.getElementById('finger-ctrl');
  if (aniMode === 'hand') {
    fingerCtrl.style.display = 'block';
  }
  const names = document.getElementById('nodeNames');
  Object.keys(renderObj.data).forEach((k) => {
    if (k === 'info') return;
    const elem = document.createElement('div');
    elem.className = 'name-tag';
    elem.id = k;
    elem.textContent = k;
    elem.onclick = () => selectNode(k);
    names.appendChild(elem);
  });

  window.cusEvt = (type, value) => {
    if (type === 'rot') {
      elemMapper[`rot${axis[value.rotType]}D`].value = value.value.toFixed(2);
    }
  };

  axis.forEach(i => {
    const rot_S = document.getElementById(`rot${i}S`);
    const rot_D = document.getElementById(`rot${i}D`);
    const rot_SPD = document.getElementById(`rot${i}SPD`);
    elemMapper[`rot${i}S`] = rot_S;
    elemMapper[`rot${i}D`] = rot_D;
    elemMapper[`rot${i}SPD`] = rot_SPD;
    const idx = axisIdx[i];
  
    rot_D.value = rotState[idx];
    rot_D.onchange = ev => rotState[idx] = Number(ev.target.value);
  
    rot_S.value = rotSpd[idx].toString();
    rot_S.onchange = (ev) => {
      rotSpd[idx] = Number(ev.target.value);
      if (rotSpd[idx] !== 0) {
        rot_D.disabled = 1;
      } else {
        rot_D.disabled = 0;
      }
      rot_SPD.value = rotSpd[idx].toFixed(2);
    };

    rot_SPD.value = rotSpd[idx].toFixed(2);
    rot_SPD.onchange = (ev) => {
      rotSpd[idx] = Number(ev.target.value);
      if (rotSpd[idx] !== 0) {
        rot_D.disabled = 1;
      } else {
        rot_D.disabled = 0;
      }
      rot_S.value = rotSpd[idx].toString();
    };
  
    const tr_D = document.getElementById(`tr${i}D`);
    elemMapper[`tr${i}D`] = tr_D;
    tr_D.value = trState[idx];
    tr_D.onchange = ev => trState[idx] = Number(ev.target.value);

    const sc_D = document.getElementById(`sc${i}D`);
    elemMapper[`sc${i}D`] = sc_D;
    sc_D.value = scState[idx];
    sc_D.onchange = ev => scState[idx] = Number(ev.target.value);

    const rot_D_N = document.getElementById(`rot${i}D-N`);
    const rot_S_N = document.getElementById(`rot${i}S-N`);
    const rot_S_SPD = document.getElementById(`rot${i}S-SPD`);
    const rot_DN_N = document.getElementById(`rot${i}DN-N`);
    const rot_SN_N = document.getElementById(`rot${i}SN-N`);
    const rot_SN_SPD = document.getElementById(`rot${i}SN-SPD`);

    const tr_D_N = document.getElementById(`tr${i}D-N`);
    const sc_D_N = document.getElementById(`sc${i}D-N`);

    rot_S_N.onchange = (ev) => {
      if (!sltd) return;
      renderObj.data[sltd].rotateSpd[idx] = Number(ev.target.value);
      rot_S_SPD.value = ev.target.value;
    };

    rot_S_SPD.onchange = (ev) => {
      if (!sltd) return;
      renderObj.data[sltd].rotateSpd[idx] = Number(ev.target.value);
      rot_S_N.value = ev.target.value;
    };

    rot_SN_N.onchange = (ev) => {
      if (!sltd) return;
      renderObj.data[sltd].rotateNodeSpd[idx] = Number(ev.target.value);
      rot_SN_SPD.value = ev.target.value;
    };

    rot_SN_SPD.onchange = (ev) => {
      if (!sltd) return;
      renderObj.data[sltd].rotateNodeSpd[idx] = Number(ev.target.value);
      rot_SN_N.value = ev.target.value;
    };

    rot_D_N.onchange = (ev) => {
      if (!sltd) return;
      renderObj.data[sltd].rotate[idx] = Number(ev.target.value);
    };

    rot_DN_N.onchange = (ev) => {
      if (!sltd) return;
      renderObj.data[sltd].rotateNode[idx] = Number(ev.target.value);
    };

    tr_D_N.onchange = (ev) => {
      if (!sltd) return;
      renderObj.data[sltd].translate[idx] = Number(ev.target.value);
    };

    sc_D_N.onchange = (ev) => {
      if (!sltd) return;
      renderObj.data[sltd].scale[idx] = Number(ev.target.value);
    };

    elemMapper[`rot${i}S-N`] = rot_S_N;
    elemMapper[`rot${i}S-SPD`] = rot_S_SPD;
    elemMapper[`rot${i}SN-N`] = rot_SN_N;
    elemMapper[`rot${i}SN-SPD`] = rot_SN_SPD;
    elemMapper[`rot${i}D-N`] = rot_D_N;
    elemMapper[`rot${i}DN-N`] = rot_DN_N;
    elemMapper[`tr${i}D-N`] = tr_D_N;
    elemMapper[`sc${i}D-N`] = sc_D_N;
  });
});

function trFunc(type, value) {
  elemMapper[`tr${axis[type]}D`].value = (trState[type] += value).toFixed(2);
}

function trNodeFunc(type, value) {
  if (!sltd) return;
  elemMapper[`tr${axis[type]}D-N`].value = (renderObj.data[sltd].translate[type] += value).toFixed(2);
}

function scFunc(type, value){
  elemMapper[`sc${axis[type]}D`].value = (scState[type] += value).toFixed(2);
}

function scNodeFunc(type, value) {
  if (!sltd) return;
  elemMapper[`sc${axis[type]}D-N`].value = (renderObj.data[sltd].scale[type] += value).toFixed(2);
}

function fingerFunc(type) {
  hand.info.fingerTog[`${type}`] = !hand.info.fingerTog[`${type}`];
}

function createNode() {
  if (!sltd) return;
  const nodeName = document.getElementById('nodeName').value;
  if (!nodeName || renderObj.data[nodeName]) return;
  const parent = renderObj.data[sltd];
  const node = {
    translate: [0.2, 0.2, 0.2],
    rotate: [0, 0, 0],
    rotateSpd: [0, 0, 0],
    rotateNode: [0, 0, 0],
    rotateNodeSpd: [0, 0, 0],
    scale: [1, 1, 1],
    children: [],
    color: [0, 1, 0, 1],
    calcedCoord: [0, 0],
    shape: createNodeType,
  };
  renderObj.data[nodeName] = node;
  parent.children.push(nodeName);
  const names = document.getElementById('nodeNames');
  const div = document.createElement('div');
  div.className = 'name-tag';
  div.id = nodeName;
  div.textContent = nodeName;
  div.onclick = () => {
    selectNode(nodeName);
  };
  names.appendChild(div);

  const cdiv = document.getElementById('children');
  const btn = document.createElement('button');
  btn.textContent = nodeName;
  btn.onclick = () => selectNode(nodeName);
  cdiv.appendChild(btn);
}

function removeNode(nodeName) {
  if (!renderObj.data[nodeName]) return;
  if (nodeName === 'root') return;
  if (sltd === nodeName) {
    selectNode(null);
  }
  renderObj.data[nodeName].children.forEach(removeNode);
  delete renderObj.data[nodeName];
  const names = document.getElementById('nodeNames');
  const div = document.getElementById(nodeName);
  names.removeChild(div);

  Object.keys(renderObj.data).forEach(key => {
    const node = renderObj.data[key];
    node.children = node.children.filter(child => child !== nodeName);
  });
}
