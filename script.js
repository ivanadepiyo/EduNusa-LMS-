const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const store = {
  get(key, fallback){try{return JSON.parse(localStorage.getItem('edunusa_'+key)) ?? fallback}catch{return fallback}},
  set(key,value){try{localStorage.setItem('edunusa_'+key,JSON.stringify(value))}catch{}}
};
const palette = [
  ['#e5efff','#1769d2','▣'],['#def8ed','#15966b','▤'],['#eee8ff','#8059dd','◉'],
  ['#fff0db','#d88418','⌘'],['#e0f4ff','#1685b8','♧'],['#ffe7ed','#df4e70','▧']
];
const defaultCourses = [
 {id:1,name:'Pemrograman Web',code:'SI-A01',category:'Teknologi',materials:3,tasks:2,progress:72},
 {id:2,name:'Basis Data',code:'SI-A02',category:'Teknologi',materials:4,tasks:1,progress:55},
 {id:3,name:'Interaksi Manusia dan Komputer',code:'SI-A03',category:'Teknologi',materials:2,tasks:1,progress:68},
 {id:4,name:'Jaringan Komputer',code:'SI-A04',category:'Teknologi',materials:3,tasks:2,progress:40},
 {id:5,name:'Sistem Informasi',code:'SI-A05',category:'Manajemen',materials:4,tasks:1,progress:83},
 {id:6,name:'Manajemen Proyek TI',code:'SI-A06',category:'Manajemen',materials:2,tasks:0,progress:61}
];
const today = new Date();
const dateIn = days => {const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)};
const defaultTasks = [
 {id:101,name:'Tugas 1 - Desain UI/UX',course:'Interaksi Manusia dan Komputer',due:dateIn(2),status:'Sedang dikerjakan',description:'Buat rancangan antarmuka yang responsif dan mudah digunakan.'},
 {id:102,name:'Tugas 2 - Basis Data',course:'Basis Data',due:dateIn(4),status:'Belum dikerjakan',description:'Susun rancangan basis data dan relasi tabel.'},
 {id:103,name:'Laporan Proyek',course:'Manajemen Proyek TI',due:dateIn(7),status:'Sudah dikumpulkan',description:'Lengkapi laporan kemajuan proyek.'},
 {id:104,name:'Tugas 1 - Pemrograman Web',course:'Pemrograman Web',due:dateIn(9),status:'Belum dikerjakan',description:'Buat halaman web menggunakan HTML, CSS, dan JavaScript.'},
 {id:105,name:'Tugas 2 - Jaringan Komputer',course:'Jaringan Komputer',due:dateIn(12),status:'Belum dikerjakan',description:'Ringkas konsep dasar jaringan komputer.'},
 {id:106,name:'Tugas 3 - Sistem Informasi',course:'Sistem Informasi',due:dateIn(15),status:'Belum dikerjakan',description:'Analisis sistem informasi pada sebuah organisasi.'}
];
const defaultAnnouncements = [
 {id:1,title:'Jadwal Ujian Tengah Semester',body:'Silakan periksa jadwal ujian pada halaman akademik dan siapkan diri lebih awal.',date:dateIn(-1),read:false},
 {id:2,title:'Pengumpulan Tugas Minggu Ini',body:'Pastikan semua tugas dikumpulkan sebelum tenggat waktu yang tercantum pada LMS.',date:dateIn(0),read:false},
 {id:3,title:'Pemeliharaan Sistem',body:'Pembaruan sistem dapat dilakukan di luar jam belajar. Simpan pekerjaan secara berkala.',date:dateIn(1),read:true}
];
let courses=store.get('courses',defaultCourses), tasks=store.get('tasks',defaultTasks), announcements=store.get('announcements',defaultAnnouncements);
let events=store.get('events',[]);
let profile=store.get('profile',{name:'Ivan Adepiyo',email:'ivan@example.com',program:'Sistem Informasi',bio:''});
let selectedDate=dateIn(0), calendarDate=new Date(today.getFullYear(),today.getMonth(),1), dialogMode=null, editingId=null;
const escapeHTML = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateFormat = s => {if(!s)return 'Belum ditentukan';const d=new Date(s+'T12:00:00');return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(d)};
const statusClass = s => s==='Sudah dikumpulkan'?'success':s==='Sedang dikerjakan'?'warning':s==='Belum dikerjakan'?'danger':'neutral';
const toast = msg => {const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600)};
const saveAll=()=>{store.set('courses',courses);store.set('tasks',tasks);store.set('announcements',announcements);store.set('events',events);store.set('profile',profile)};
function courseCard(c,i){const p=palette[i%palette.length];const n=(c.name+' '+c.category).toLowerCase();const art=n.includes('basis data')?'database':n.includes('interaksi')||n.includes('ui/ux')?'imk':n.includes('jaringan')?'network':n.includes('manajemen proyek')||n.includes('proyek')?'project':n.includes('sistem informasi')?'info':'web';return `<article class="course-card theme-${art}" data-search="${escapeHTML((c.name+' '+c.code+' '+c.category).toLowerCase())}"><div class="course-symbol" style="background:${p[0]};color:${p[1]}">${p[2]}</div><h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.code)} · ${escapeHTML(c.category)}</p><div class="course-meta"><span>${c.materials} materi</span><span>${c.tasks} tugas</span></div><div class="course-progress" aria-label="Progres ${c.progress}%"><span style="width:${Math.max(0,Math.min(100,c.progress))}%"></span></div><div class="course-meta" style="margin-top:6px"><span>Progres belajar</span><b>${c.progress}%</b></div><div class="row-actions" style="margin-top:12px"><button class="small-btn" data-course-edit="${c.id}">Edit</button><button class="small-btn danger-btn" data-course-delete="${c.id}">Hapus</button></div></article>`}
function taskMini(t){return `<article class="task-mini"><div class="mini-icon">▤</div><div><h3>${escapeHTML(t.name)}</h3><p>${escapeHTML(t.course)} · ${dateFormat(t.due)}</p><div class="task-mini-bottom"><span class="status-pill ${statusClass(t.status)}">${escapeHTML(t.status)}</span><button class="text-btn" data-task-edit="${t.id}">Detail →</button></div></div></article>`}
function renderHome(){
 $('#welcomeName').textContent=profile.name;$('#userNameTop').textContent=profile.name;$('#statCourses').textContent=courses.length;
 $('#statTasks').textContent=tasks.filter(t=>t.status!=='Sudah dikumpulkan').length;$('#statAnnouncements').textContent=announcements.filter(a=>!a.read).length;
 $('#homeCourses').innerHTML=courses.slice(0,6).map(courseCard).join('')||'<div class="empty-state">Belum ada mata kuliah.</div>';
 $('#homeTasks').innerHTML=[...tasks].filter(t=>t.status!=='Sudah dikumpulkan').sort((a,b)=>a.due.localeCompare(b.due)).slice(0,3).map(taskMini).join('')||'<div class="empty-state">Semua tugas sudah dikumpulkan 🎉</div>';
 $('#homeAnnouncements').innerHTML=announcements.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2).map(a=>`<article><span class="announcement-icon">♢</span><div><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML(a.body)}</p></div></article>`).join('');
}
function renderCourses(){
 const filter=$('#courseFilter').value;
 const list=courses.filter(c=>filter==='all'||c.category===filter);
 $('#coursesList').innerHTML=list.map(courseCard).join('')||'<div class="empty-state">Tidak ada mata kuliah yang cocok.</div>';
}
function renderTasks(){
 const courseFilter=$('#taskCourseFilter').value,statusFilter=$('#taskStatusFilter').value;
 const filtered=tasks.filter(t=>(courseFilter==='all'||t.course===courseFilter)&&(statusFilter==='all'||t.status===statusFilter));
 $('#tasksTableBody').innerHTML=filtered.map(t=>`<tr data-search="${escapeHTML((t.name+' '+t.course+' '+t.status).toLowerCase())}"><td><div class="task-title"><span class="task-icon">▤</span><span><b>${escapeHTML(t.name)}</b><small>${escapeHTML(t.description||'Tugas perkuliahan')}</small></span></div></td><td>${escapeHTML(t.course)}</td><td>▦ &nbsp;${dateFormat(t.due)}</td><td><span class="status-pill ${statusClass(t.status)}">${escapeHTML(t.status)}</span></td><td><div class="row-actions"><button class="small-btn" data-task-edit="${t.id}">Detail / Edit</button><button class="small-btn danger-btn" data-task-delete="${t.id}">Hapus</button></div></td></tr>`).join('')||'<tr><td colspan="5"><div class="empty-state"><b>Tidak ada tugas ditemukan</b>Coba ubah kata kunci atau filter.</div></td></tr>';
 $('#taskCount').textContent=`${filtered.length} dari ${tasks.length} tugas`;
 $('#taskCourseFilter').innerHTML='<option value="all">Semua Mata Kuliah</option>'+courses.map(c=>`<option>${escapeHTML(c.name)}</option>`).join('');
}
function renderGrades(){
 $('#gradesBody').innerHTML=courses.map((c,i)=>{const vals=[[88,92,'A'],[85,84,'A−'],[90,87,'A'],[80,82,'B+'],[86,89,'A−'],[82,85,'B+']][i%6];return `<tr><td>${escapeHTML(c.name)}</td><td>${vals[0]}</td><td>${vals[1]}</td><td><b>${Math.round((vals[0]+vals[1])/2)}</b></td><td><span class="status-pill ${vals[2].startsWith('A')?'success':'info'}">${vals[2]}</span></td></tr>`}).join('');
}
function renderAnnouncements(){
 $('#announcementsList').innerHTML=announcements.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(a=>`<article class="announcement-item ${a.read?'':'unread'}"><span class="announcement-icon">♢</span><div><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML(a.body)}</p><small>◷ ${dateFormat(a.date)} ${a.read?'· Sudah dibaca':'· Belum dibaca'}</small></div><button class="small-btn mark-read" data-read="${a.id}">${a.read?'Dibaca':'Tandai dibaca'}</button></article>`).join('')||'<div class="empty-state">Belum ada pengumuman.</div>';
 $('#notificationDot').style.display=announcements.some(a=>!a.read)?'block':'none';
}
function renderCalendar(){
 const year=calendarDate.getFullYear(),month=calendarDate.getMonth();
 $('#monthLabel').textContent=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(calendarDate);
 const names=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];let html=names.map(n=>`<div class="calendar-day-name">${n}</div>`).join('');
 const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate(),prevDays=new Date(year,month,0).getDate();
 const hasDate=d=>tasks.some(t=>t.due===d)||events.some(e=>e.date===d);
 for(let i=0;i<42;i++){let day=i-first+1,other=day<1||day>days,num=day<1?prevDays+day:day>days?day-days:day;let d=new Date(year,month,num);if(day<1)d=new Date(year,month-1,num);if(day>days)d=new Date(year,month+1,num);let iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;html+=`<button class="calendar-day ${other?'muted-day':''} ${iso===dateIn(0)?'today':''} ${iso===selectedDate?'selected':''} ${hasDate(iso)?'has-event':''}" data-date="${iso}">${num}</button>`}
 $('#calendarGrid').innerHTML=html;$('#selectedDateLabel').textContent=dateFormat(selectedDate);
 const dayTasks=tasks.filter(t=>t.due===selectedDate),dayEvents=events.filter(e=>e.date===selectedDate);
 $('#dayEvents').innerHTML=`<h3>Agenda · ${dateFormat(selectedDate)}</h3>`+([...dayTasks.map(t=>({title:t.name,detail:`Tugas · ${t.course}`})),...dayEvents.map(e=>({title:e.title,detail:e.detail||'Agenda pribadi'}))].map(e=>`<div class="event-line"><b>${escapeHTML(e.title)}</b><span>${escapeHTML(e.detail)}</span></div>`).join('')||'<p class="muted">Belum ada agenda pada tanggal ini.</p>');
}
function renderProfile(){
 $('#profileName').value=profile.name;$('#profileEmail').value=profile.email;$('#profileProgram').value=profile.program;$('#profileBio').value=profile.bio||'';
 $('#profileDisplayName').textContent=profile.name;$('#userNameTop').textContent=profile.name;$('#welcomeName').textContent=profile.name;
 const initials=profile.name.split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('');$$('.avatar').forEach(a=>a.textContent=initials||'ED');
}
function renderAll(){renderHome();renderCourses();renderTasks();renderGrades();renderAnnouncements();renderCalendar();renderProfile();saveAll()}
function navigate(page){
 const target=$(`#page-${CSS.escape(page)}`);if(!target)return;
 $$('.page').forEach(p=>p.classList.toggle('active',p===target));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 $('#sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',e=>{
 const page=e.target.closest('[data-page]');if(page){e.preventDefault();navigate(page.dataset.page);return}
 const editTask=e.target.closest('[data-task-edit]');if(editTask){openTaskDialog(Number(editTask.dataset.taskEdit));return}
 const delTask=e.target.closest('[data-task-delete]');if(delTask){deleteTask(Number(delTask.dataset.taskDelete));return}
 const editCourse=e.target.closest('[data-course-edit]');if(editCourse){openCourseDialog(Number(editCourse.dataset.courseEdit));return}
 const delCourse=e.target.closest('[data-course-delete]');if(delCourse){deleteCourse(Number(delCourse.dataset.courseDelete));return}
 const read=e.target.closest('[data-read]');if(read){const a=announcements.find(x=>x.id===Number(read.dataset.read));if(a)a.read=true;renderAll();toast('Status pengumuman diperbarui.');return}
 const day=e.target.closest('[data-date]');if(day){selectedDate=day.dataset.date;calendarDate=new Date(selectedDate+'T12:00:00');calendarDate.setDate(1);renderCalendar();return}
});
$('#mainNav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)navigate(b.dataset.page)});
$('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#profileShortcut').addEventListener('click',()=>navigate('Profil'));
$('#notificationBtn').addEventListener('click',()=>{navigate('Pengumuman');const unread=announcements.filter(a=>!a.read).length;toast(unread?`${unread} pengumuman belum dibaca.`:'Semua pengumuman sudah dibaca.')});
$('#courseFilter').addEventListener('change',renderCourses);$('#taskCourseFilter').addEventListener('change',renderTasks);$('#taskStatusFilter').addEventListener('change',renderTasks);
$$('.local-search').forEach(input=>input.addEventListener('input',()=>{$$('[data-search]',document.getElementById(input.dataset.target)).forEach(el=>el.classList.toggle('hidden',!el.dataset.search.includes(input.value.toLowerCase()))) }));
$('#globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.trim().toLowerCase();if(!q)return;const taskMatch=tasks.some(t=>(t.name+' '+t.course).toLowerCase().includes(q)),courseMatch=courses.some(c=>(c.name+' '+c.code).toLowerCase().includes(q));if(taskMatch){navigate('Tugas');$('.local-search[data-target="tasksTableBody"]').value=q;$('.local-search[data-target="tasksTableBody"]').dispatchEvent(new Event('input'))}else if(courseMatch){navigate('Mata Kuliah');$('.local-search[data-target="coursesList"]').value=q;$('.local-search[data-target="coursesList"]').dispatchEvent(new Event('input'))}else{navigate('Pengumuman');toast('Hasil pencarian mungkin ada di pengumuman.')} }} );
$('#addCourseBtn').addEventListener('click',()=>openCourseDialog());
$('#addTaskBtn').addEventListener('click',()=>openTaskDialog());
$('#addEventBtn').addEventListener('click',()=>openEventDialog());
$('#prevMonth').addEventListener('click',()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()});
$('#nextMonth').addEventListener('click',()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()});
$('#markAllRead').addEventListener('click',()=>{announcements.forEach(a=>a.read=true);renderAll();toast('Semua pengumuman ditandai sudah dibaca.')});
$('#profileForm').addEventListener('submit',e=>{e.preventDefault();profile={name:$('#profileName').value.trim(),email:$('#profileEmail').value.trim(),program:$('#profileProgram').value.trim(),bio:$('#profileBio').value.trim()};saveAll();renderProfile();renderHome();$('#profileMessage').textContent='Profil berhasil disimpan di browser ini.';toast('Profil berhasil diperbarui.')});
$('#exportGrades').addEventListener('click',()=>{const rows=[['Mata Kuliah','Tugas','Ujian','Nilai Akhir','Huruf'],...courses.map((c,i)=>{const v=[[88,92,'A'],[85,84,'A-'],[90,87,'A'],[80,82,'B+'],[86,89,'A-'],[82,85,'B+']][i%6];return[c.name,v[0],v[1],Math.round((v[0]+v[1])/2),v[2]]})];downloadCSV('rekap-nilai-edunusa.csv',rows);toast('File CSV nilai dibuat.')});
function downloadCSV(filename,rows){const csv=rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}
function openDialog(title,mode,id,fields){dialogMode=mode;editingId=id;$('#dialogTitle').textContent=title;$('#dialogFields').innerHTML=fields;$('#itemDialog').showModal()}
function field(label,name,value='',type='text',extra=''){return `<label>${label}<input name="${name}" type="${type}" value="${escapeHTML(value)}" ${extra} required></label>`}
function openCourseDialog(id){
 const c=courses.find(x=>x.id===id)||{name:'',code:'',category:'Teknologi',materials:1,tasks:0,progress:0};
 openDialog(id?'Edit Mata Kuliah':'Tambah Mata Kuliah','course',id,
 field('Nama mata kuliah','name',c.name)+field('Kode mata kuliah','code',c.code)+`<label>Kategori<select name="category"><option ${c.category==='Teknologi'?'selected':''}>Teknologi</option><option ${c.category==='Manajemen'?'selected':''}>Manajemen</option><option ${c.category==='Umum'?'selected':''}>Umum</option></select></label>`+field('Jumlah materi','materials',c.materials,'number','min="0"')+field('Jumlah tugas','tasks',c.tasks,'number','min="0"')+field('Progres (%)','progress',c.progress,'number','min="0" max="100"'));
}
function openTaskDialog(id){
 const t=tasks.find(x=>x.id===id)||{name:'',course:courses[0]?.name||'',due:dateIn(7),status:'Belum dikerjakan',description:''};
 openDialog(id?'Detail / Edit Tugas':'Tambah Tugas','task',id,
 field('Nama tugas','name',t.name)+`<label>Mata kuliah<select name="course" required>${courses.map(c=>`<option ${c.name===t.course?'selected':''}>${escapeHTML(c.name)}</option>`).join('')}</select></label>`+field('Tenggat','due',t.due,'date')+`<label>Status<select name="status"><option ${t.status==='Belum dikerjakan'?'selected':''}>Belum dikerjakan</option><option ${t.status==='Sedang dikerjakan'?'selected':''}>Sedang dikerjakan</option><option ${t.status==='Sudah dikumpulkan'?'selected':''}>Sudah dikumpulkan</option></select></label><label>Deskripsi<textarea name="description" rows="3">${escapeHTML(t.description||'')}</textarea></label>`);
}
function openEventDialog(){openDialog('Tambah Agenda','event',null,field('Nama agenda','title','')+field('Tanggal','date',selectedDate,'date')+`<label>Catatan<textarea name="detail" rows="3" placeholder="Detail agenda (opsional)"></textarea></label>`)}
$('#itemForm').addEventListener('submit',e=>{
 if(e.submitter?.value==='cancel')return;e.preventDefault();
 const data=Object.fromEntries(new FormData(e.currentTarget).entries());
 if(dialogMode==='course'){
  const item={...data,id:editingId||Date.now(),materials:Number(data.materials),tasks:Number(data.tasks),progress:Math.max(0,Math.min(100,Number(data.progress)))};
  if(editingId)courses=courses.map(c=>c.id===editingId?item:c);else courses.push(item);
  toast(editingId?'Mata kuliah diperbarui.':'Mata kuliah ditambahkan.');
 }else if(dialogMode==='task'){
  const item={...data,id:editingId||Date.now()};
  if(editingId)tasks=tasks.map(t=>t.id===editingId?item:t);else tasks.push(item);
  toast(editingId?'Tugas diperbarui.':'Tugas ditambahkan.');
 }else if(dialogMode==='event'){events.push({...data,id:Date.now()});selectedDate=data.date;calendarDate=new Date(data.date+'T12:00:00');calendarDate.setDate(1);toast('Agenda ditambahkan ke kalender.')}
 $('#itemDialog').close();renderAll();
});
function deleteTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;if(confirm(`Hapus tugas "${t.name}"?`)){tasks=tasks.filter(x=>x.id!==id);renderAll();toast('Tugas dihapus.')}} 
function deleteCourse(id){const c=courses.find(x=>x.id===id);if(!c)return;if(confirm(`Hapus mata kuliah "${c.name}"?`)){courses=courses.filter(x=>x.id!==id);renderAll();toast('Mata kuliah dihapus.')}} 
renderAll();
