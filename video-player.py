import sys
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton, QLabel, QFileDialog, QSlider, QHBoxLayout
)
from PyQt5.QtMultimedia import QMediaPlayer, QMediaContent
from PyQt5.QtMultimediaWidgets import QVideoWidget
from PyQt5.QtCore import Qt, QUrl, QTimer

class VideoPlayer(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle('Python Video Player')
        self.setGeometry(100, 100, 800, 600)
        self.player = QMediaPlayer(None, QMediaPlayer.VideoSurface)
        self.video_widget = QVideoWidget()
        self.open_btn = QPushButton('Open Video')
        self.play_btn = QPushButton('Play/Pause')
        self.slider = QSlider(Qt.Horizontal)
        self.slider.setRange(0, 1000)
        self.shortcut_label = QLabel(self.shortcut_text())
        self.shortcut_label.setWordWrap(True)
        self.shortcut_label.setStyleSheet('font-size: 14px;')
        self.status = QLabel('No video loaded')

        layout = QVBoxLayout()
        layout.addWidget(self.video_widget)
        controls = QHBoxLayout()
        controls.addWidget(self.open_btn)
        controls.addWidget(self.play_btn)
        layout.addLayout(controls)
        layout.addWidget(self.slider)
        layout.addWidget(self.status)
        layout.addWidget(self.shortcut_label)
        self.setLayout(layout)

        self.player.setVideoOutput(self.video_widget)
        self.open_btn.clicked.connect(self.open_file)
        self.play_btn.clicked.connect(self.toggle_play)
        self.slider.sliderMoved.connect(self.seek)
        self.player.positionChanged.connect(self.update_slider)
        self.player.durationChanged.connect(self.update_duration)
        self.duration = 0
        self.timer = QTimer(self)
        self.timer.setInterval(1000)
        self.timer.timeout.connect(self.update_status)
        self.timer.start()

    def open_file(self):
        file_name, _ = QFileDialog.getOpenFileName(self, 'Open Video')
        if file_name:
            self.player.setMedia(QMediaContent(QUrl.fromLocalFile(file_name)))
            self.player.play()
            self.status.setText(f'Loaded: {file_name}')

    def toggle_play(self):
        if self.player.state() == QMediaPlayer.PlayingState:
            self.player.pause()
        else:
            self.player.play()

    def seek(self, position):
        if self.duration:
            self.player.setPosition(int(position / 1000 * self.duration))

    def update_slider(self, position):
        if self.duration:
            self.slider.blockSignals(True)
            self.slider.setValue(int(position / self.duration * 1000))
            self.slider.blockSignals(False)

    def update_duration(self, duration):
        self.duration = duration
        self.slider.setValue(0)

    def update_status(self):
        if self.duration:
            pos = self.player.position() / 1000
            dur = self.duration / 1000
            self.status.setText(f'{pos:.1f}s / {dur:.1f}s')

    def shortcut_text(self):
        return (
            '<b>Keyboard Shortcuts:</b><br>'
            '<b>Space</b> or <b>K</b>: Play/Pause<br>'
            '<b>J</b>: Rewind 10s<br>'
            '<b>L</b>: Forward 10s<br>'
            '<b>Left Arrow</b>: Rewind 5s<br>'
            '<b>Right Arrow</b>: Forward 5s<br>'
            '<b>T</b>: (No theater mode in desktop)<br>'
            '<b>F</b>: Toggle Fullscreen<br>'
            '<b>Shift+&gt;</b>: Next Speed<br>'
            '<b>Shift+&lt;</b>: Previous Speed<br>'
            '<b>0-9</b>: Jump to 0%, 10%, ..., 90% of video'
        )

    def keyPressEvent(self, event):
        if not self.duration:
            return
        key = event.key()
        mod = event.modifiers()
        # 0-9 shortcuts
        if Qt.Key_0 <= key <= Qt.Key_9 and not (mod & (Qt.ShiftModifier | Qt.ControlModifier | Qt.AltModifier | Qt.MetaModifier)):
            num = key - Qt.Key_0
            self.player.setPosition(int(self.duration * num / 10))
            return
        # Space or K: Play/Pause
        if key in (Qt.Key_Space, Qt.Key_K):
            self.toggle_play()
            return
        # J: Rewind 10s
        if key == Qt.Key_J:
            self.player.setPosition(max(0, self.player.position() - 10000))
            return
        # L: Forward 10s
        if key == Qt.Key_L:
            self.player.setPosition(min(self.duration, self.player.position() + 10000))
            return
        # Left Arrow: Rewind 5s
        if key == Qt.Key_Left:
            self.player.setPosition(max(0, self.player.position() - 5000))
            return
        # Right Arrow: Forward 5s
        if key == Qt.Key_Right:
            self.player.setPosition(min(self.duration, self.player.position() + 5000))
            return
        # F: Fullscreen
        if key == Qt.Key_F:
            if self.isFullScreen():
                self.showNormal()
            else:
                self.showFullScreen()
            return
        # Shift+>: Next speed
        if key == Qt.Key_Greater and (mod & Qt.ShiftModifier):
            self.change_speed(1)
            return
        # Shift+<: Previous speed
        if key == Qt.Key_Less and (mod & Qt.ShiftModifier):
            self.change_speed(-1)
            return

    def change_speed(self, direction):
        rates = [0.5, 1.0, 1.25, 1.5, 2.0]
        current = self.player.playbackRate()
        try:
            idx = rates.index(current)
        except ValueError:
            idx = 1  # default to 1.0
        idx = max(0, min(len(rates) - 1, idx + direction))
        self.player.setPlaybackRate(rates[idx])
        self.status.setText(f'Speed: {rates[idx]}x')

if __name__ == '__main__':
    app = QApplication(sys.argv)
    player = VideoPlayer()
    player.show()
    sys.exit(app.exec_())
