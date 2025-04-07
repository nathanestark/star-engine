import NBody from "./n-body/n-body";

const canvases = [
    document.getElementById("cvsSystem1"),
    document.getElementById("cvsSystem2"),
    document.getElementById("cvsSystem3")
];

const game = new NBody(canvases);

game.start();
const btnPause = document.getElementById("btnPause");
btnPause.addEventListener("click", function () {
    if (game.isPaused()) {
        game.resume();
        btnPause.setAttribute("value", "Pause");
    } else {
        game.pause();
        btnPause.setAttribute("value", "Resume");
    }
});

const tbxTimeScale = document.getElementById("tbxTimeScale");
tbxTimeScale.value = game.getTimeScale();
tbxTimeScale.addEventListener("input", function () {
    const val = parseInt(tbxTimeScale.value);
    if (!isNaN(val)) game.setTimeScale(val);
});

const tbxMinShowRadius = document.getElementById("tbxMinShowRadius");
tbxMinShowRadius.addEventListener("input", function () {
    const val = parseInt(tbxMinShowRadius.value);
    if (!isNaN(val)) game.setMinShowRadius(val);
});

const tbxObjectScale = document.getElementById("tbxObjectScale");
tbxObjectScale.addEventListener("input", function () {
    const val = parseInt(tbxObjectScale.value);
    if (!isNaN(val)) game.setObjectScale(val);
});

const tbxDrawnOrbitLength = document.getElementById("tbxDrawnOrbitLength");
tbxDrawnOrbitLength.addEventListener("input", function () {
    const val = parseInt(tbxDrawnOrbitLength.value);
    if (!isNaN(val))
        game.setDrawnOrbitLength(val, cbxDrawOrbitLengthIfSelected.getAttribute("checked"));
});

const cbxDrawOrbitLengthIfSelected = document.getElementById("cbxDrawOrbitLengthIfSelected");
cbxDrawOrbitLengthIfSelected.addEventListener("change", function () {
    const val = parseInt(tbxDrawnOrbitLength.value);
    if (!isNaN(val)) {
        game.setDrawnOrbitLength(val, cbxDrawOrbitLengthIfSelected.getAttribute("checked"));
    } else {
        game.setDrawnOrbitLength(
            game.getDrawnOrbitLength(),
            cbxDrawOrbitLengthIfSelected.getAttribute("checked")
        );
    }
});
