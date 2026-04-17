import sys
import os
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QLabel, QPushButton, QStackedWidget, QMessageBox, 
                             QProgressBar, QGroupBox, QSlider, QRadioButton, 
                             QHBoxLayout, QComboBox, QFileDialog, QCheckBox)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QPixmap, QIcon
from backend import DependencyManager, CaptionEngine

# --- THREADS (No changes here) ---
class InstallerThread(QThread):
    progress = pyqtSignal(str)
    finished = pyqtSignal()
    def run(self):
        manager = DependencyManager()
        manager.install_ai_engine(self.progress.emit)
        self.finished.emit()

class GenerationThread(QThread):
    finished = pyqtSignal(list)
    def __init__(self, engine, video, folder, model, params, formats, ai_options):
        super().__init__()
        self.engine, self.video, self.folder = engine, video, folder
        self.model, self.params, self.formats = model, params, formats
        self.ai_options = ai_options
    def run(self):
        full_params = {**self.params, **self.ai_options}
        captions = self.engine.generate(self.video, self.model, **full_params)
        paths = self.engine.save_files(captions, self.folder, os.path.splitext(os.path.basename(self.video))[0], self.formats)
        self.finished.emit(paths)

# --- STYLED DROP ZONE ---
class DropZone(QLabel):
    def __init__(self, parent=None):
        super().__init__("Drag & Drop Video Here", parent)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        # Velvet theme specific styling
        self.setStyleSheet("""
            QLabel {
                border: 2px dashed #444; 
                padding: 40px; 
                font-size: 16px; 
                color: #888; 
                background-color: #1A1A1A;
                border-radius: 10px;
            }
        """)
        self.setAcceptDrops(True)
        self.file_path = None

    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls():
            event.accept()
            self.setStyleSheet("border: 2px dashed #FF5252; color: #FFF; background-color: #251010; border-radius: 10px;")
        else:
            event.ignore()

    def dragLeaveEvent(self, event):
        if not self.file_path:
            self.setStyleSheet("""
                QLabel {
                    border: 2px dashed #444; 
                    padding: 40px; 
                    font-size: 16px; 
                    color: #888; 
                    background-color: #1A1A1A;
                    border-radius: 10px;
                }
            """)

    def dropEvent(self, event):
        files = [u.toLocalFile() for u in event.mimeData().urls()]
        if files:
            self.file_path = files[0]
            self.setText(f"READY: {os.path.basename(self.file_path)}")
            # Success state styling
            self.setStyleSheet("border: 2px solid #990000; color: #FF5252; background-color: #251010; font-weight: bold; border-radius: 10px;")

# --- MAIN APP ---
class App(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Caption Generator Pro")
        self.resize(600, 900)
        
        # Set App Icon if available
        if os.path.exists("logo.png"):
            self.setWindowIcon(QIcon("logo.png"))
        
        self.dep_manager = DependencyManager()
        self.engine = CaptionEngine()
        
        self.stack = QStackedWidget()
        self.setCentralWidget(self.stack)
        
        self.init_welcome_screen()
        self.init_install_screen()
        self.init_main_screen()
        
        self.stack.setCurrentIndex(0) 

        if os.path.exists("style.qss"):
            with open("style.qss", "r") as f:
                self.setStyleSheet(f.read())

    # --- HELPER: LOGO LOADER ---
    def get_logo_widget(self):
        """Returns an Image widget if logo.png exists, else Text widget"""
        if os.path.exists("logo.png"):
            lbl_logo = QLabel()
            pixmap = QPixmap("logo.png")
            # Scale logo to reasonable size (e.g. 150px height)
            scaled_pixmap = pixmap.scaledToHeight(150, Qt.TransformationMode.SmoothTransformation)
            lbl_logo.setPixmap(scaled_pixmap)
            lbl_logo.setAlignment(Qt.AlignmentFlag.AlignCenter)
            return lbl_logo
        else:
            title = QLabel("Caption Generator")
            title.setObjectName("title")
            title.setAlignment(Qt.AlignmentFlag.AlignCenter)
            return title

    # 1. WELCOME
    def init_welcome_screen(self):
        page = QWidget()
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(40)
        
        # Add Logo or Title
        layout.addWidget(self.get_logo_widget())
        
        btn_start = QPushButton("START NEW PROJECT")
        btn_start.setFixedSize(250, 60)
        btn_start.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_start.clicked.connect(self.check_requirements)
        
        layout.addWidget(btn_start)
        page.setLayout(layout)
        self.stack.addWidget(page)

    # 2. INSTALL
    def init_install_screen(self):
        self.page_install = QWidget()
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(20)
        
        self.lbl_status = QLabel("Checking Requirements...")
        self.lbl_status.setObjectName("status_ready")
        
        self.install_bar = QProgressBar()
        self.install_bar.setFixedSize(400, 10) # Slimmer, minimal bar
        
        self.btn_install = QPushButton("Download AI Engine")
        self.btn_install.setFixedSize(250, 50)
        self.btn_install.clicked.connect(self.run_installer)
        self.btn_install.setVisible(False)
        
        layout.addWidget(self.lbl_status)
        layout.addWidget(self.install_bar)
        layout.addWidget(self.btn_install)
        self.page_install.setLayout(layout)
        self.stack.addWidget(self.page_install)

    # 3. MAIN GENERATION
    def init_main_screen(self):
        page = QWidget()
        layout = QVBoxLayout()
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(15)
        
        # Logo header (smaller)
        if os.path.exists("logo.png"):
             # Header layout just for small logo
             header_layout = QHBoxLayout()
             header_layout.addStretch()
             small_logo = QLabel()
             pix = QPixmap("logo.png").scaledToHeight(40, Qt.TransformationMode.SmoothTransformation)
             small_logo.setPixmap(pix)
             header_layout.addWidget(small_logo)
             header_layout.addStretch()
             layout.addLayout(header_layout)

        # Drag Drop
        self.drop_zone = DropZone()
        layout.addWidget(self.drop_zone)
        
        # AI Tools
        grp_ai = QGroupBox("AI Magic Tools")
        l_ai = QHBoxLayout()
        self.chk_trans = QCheckBox("Translate to English")
        self.chk_clean = QCheckBox("Remove Filler Words")
        l_ai.addWidget(self.chk_trans)
        l_ai.addWidget(self.chk_clean)
        grp_ai.setLayout(l_ai)
        layout.addWidget(grp_ai)

        # Settings
        grp_set = QGroupBox("Caption Configuration")
        l_set = QVBoxLayout()
        
        # Max Chars
        h_chars = QHBoxLayout()
        self.lbl_chars = QLabel("Max Length: 42")
        self.s_chars = QSlider(Qt.Orientation.Horizontal)
        self.s_chars.setRange(10, 80)
        self.s_chars.setValue(42)
        self.s_chars.valueChanged.connect(lambda v: self.lbl_chars.setText(f"Max Length: {v}"))
        h_chars.addWidget(self.lbl_chars)
        h_chars.addWidget(self.s_chars)
        l_set.addLayout(h_chars)

        # Max Duration
        h_dur = QHBoxLayout()
        self.lbl_dur = QLabel("Max Duration: 3.0s")
        self.s_dur = QSlider(Qt.Orientation.Horizontal)
        self.s_dur.setRange(10, 100)
        self.s_dur.setValue(30)
        self.s_dur.valueChanged.connect(self.update_dur_label)
        h_dur.addWidget(self.lbl_dur)
        h_dur.addWidget(self.s_dur)
        l_set.addLayout(h_dur)

        # Gap
        h_gap = QHBoxLayout()
        self.lbl_gap = QLabel("Gap: 0 frames")
        self.s_gap = QSlider(Qt.Orientation.Horizontal)
        self.s_gap.setRange(0, 10) 
        self.s_gap.setValue(0)
        self.s_gap.valueChanged.connect(lambda v: self.lbl_gap.setText(f"Gap: {v} frames"))
        h_gap.addWidget(self.lbl_gap)
        h_gap.addWidget(self.s_gap)

        # Lines
        l_lines = QHBoxLayout()
        self.r_double = QRadioButton("Double Lines")
        self.r_double.setChecked(True)
        self.r_single = QRadioButton("Single Line")
        l_lines.addWidget(self.r_double)
        l_lines.addWidget(self.r_single)
        l_set.addLayout(l_lines)
        
        grp_set.setLayout(l_set)
        layout.addWidget(grp_set)

        # Formats
        grp_fmt = QGroupBox("Output Formats")
        l_fmt = QHBoxLayout()
        self.chk_srt = QCheckBox("SRT")
        self.chk_srt.setChecked(True)
        self.chk_vtt = QCheckBox("VTT")
        self.chk_json = QCheckBox("JSON")
        self.chk_txt = QCheckBox("TXT")
        l_fmt.addWidget(self.chk_srt)
        l_fmt.addWidget(self.chk_vtt)
        l_fmt.addWidget(self.chk_json)
        l_fmt.addWidget(self.chk_txt)
        grp_fmt.setLayout(l_fmt)
        layout.addWidget(grp_fmt)

        # Model
        h_mod = QHBoxLayout()
        h_mod.addWidget(QLabel("Accuracy:"))
        self.combo_model = QComboBox()
        self.combo_model.addItem("Standard (Faster)", "faster")
        self.combo_model.addItem("High (Slower)", "accurate")
        h_mod.addWidget(self.combo_model)
        layout.addLayout(h_mod)
        
        # Status & Button
        self.status_label = QLabel("Ready")
        self.status_label.setObjectName("status_ready")
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.status_label)

        self.gen_progress = QProgressBar()
        self.gen_progress.setTextVisible(False)
        self.gen_progress.setRange(0, 100)
        self.gen_progress.setValue(0)
        layout.addWidget(self.gen_progress)
        
        self.btn_gen = QPushButton("GENERATE CAPTIONS")
        self.btn_gen.setMinimumHeight(55)
        self.btn_gen.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_gen.clicked.connect(self.prepare_generation)
        layout.addWidget(self.btn_gen)
        
        page.setLayout(layout)
        self.stack.addWidget(page)

    def update_dur_label(self, value):
        self.lbl_dur.setText(f"Max Duration: {value/10.0}s")

    # --- LOGIC ---
    def check_requirements(self):
        self.stack.setCurrentIndex(1)
        if self.dep_manager.check_requirements():
            self.lbl_status.setText("Ready to Launch")
            self.lbl_status.setObjectName("status_done")
            self.lbl_status.style().unpolish(self.lbl_status)
            self.lbl_status.style().polish(self.lbl_status)
            self.install_bar.setValue(100)
            QThread.msleep(500)
            self.stack.setCurrentIndex(2)
        else:
            self.lbl_status.setText("First Time Setup Required")
            self.btn_install.setVisible(True)

    def run_installer(self):
        self.btn_install.setEnabled(False)
        self.installer = InstallerThread()
        self.installer.progress.connect(self.lbl_status.setText)
        self.installer.finished.connect(self.check_requirements)
        self.installer.start()

    def prepare_generation(self):
        if not self.drop_zone.file_path:
            QMessageBox.warning(self, "Error", "Drop a video file first")
            return
            
        formats = []
        if self.chk_srt.isChecked(): formats.append('srt')
        if self.chk_vtt.isChecked(): formats.append('vtt')
        if self.chk_json.isChecked(): formats.append('json')
        if self.chk_txt.isChecked(): formats.append('txt')
        
        if not formats:
            QMessageBox.warning(self, "Error", "Select an output format")
            return

        folder = QFileDialog.getExistingDirectory(self, "Select Output Folder")
        if folder:
            self.btn_gen.setEnabled(False)
            self.btn_gen.setText("PROCESSING...")
            
            self.status_label.setText("Analyzing Audio...")
            self.status_label.setObjectName("status_processing")
            self.status_label.style().unpolish(self.status_label)
            self.status_label.style().polish(self.status_label)
            
            self.gen_progress.setRange(0, 0) # Bounce
            
            params = {
                'max_chars': self.s_chars.value(),
                'max_dur': self.s_dur.value() / 10.0,
                'gap_frames': self.s_gap.value(),
                'line_mode': 'double' if self.r_double.isChecked() else 'single'
            }
            ai_options = {
                'translate': self.chk_trans.isChecked(),
                'remove_fillers': self.chk_clean.isChecked()
            }
            model_type = self.combo_model.currentData()
            
            self.gen_thread = GenerationThread(self.engine, self.drop_zone.file_path, folder, model_type, params, formats, ai_options)
            self.gen_thread.finished.connect(self.generation_done)
            self.gen_thread.start()

    def generation_done(self, paths):
        self.gen_progress.setRange(0, 100)
        self.gen_progress.setValue(100)
        
        self.status_label.setText("Completed")
        self.status_label.setObjectName("status_done")
        self.status_label.style().unpolish(self.status_label)
        self.status_label.style().polish(self.status_label)
        
        self.btn_gen.setText("GENERATE CAPTIONS")
        self.btn_gen.setEnabled(True)
        
        QMessageBox.information(self, "Success", "Files saved successfully!")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = App()
    window.show()
    sys.exit(app.exec())