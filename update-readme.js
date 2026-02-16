const fs = require('fs');

// Gunakan domain web kamu
const API_URL = 'https://setyaw.xyz';

async function generateReadme() {
  try {
    console.log('Mengambil data dari API setyaw.xyz...');

    // 1. Fetch semua data secara bersamaan (Parallel Fetch)
    const [profile, projects, experience, education, certs, research, skills] = await Promise.all([
      fetch(`${API_URL}/api/profile`).then(res => res.json()),
      fetch(`${API_URL}/api/projects`).then(res => res.json()),
      fetch(`${API_URL}/api/experience`).then(res => res.json()),
      fetch(`${API_URL}/api/education`).then(res => res.json()),
      fetch(`${API_URL}/api/certificates`).then(res => res.json()),
      fetch(`${API_URL}/api/research`).then(res => res.json()),
      fetch(`${API_URL}/api/skills`).then(res => res.json()),
    ]);

    // 2. Hitung Statistik
    const completedProjects = projects.filter(p => p.status === 'SELESAI').length;
    const ongoingProjects = projects.filter(p => p.status === 'BERJALAN').length;
    const totalCerts = certs.length;
    const totalResearch = research.length;

    // 3. Mulai merangkai Markdown
    let md = ``;

    // --- BAGIAN: HEADER & BIO ---
    md += `<h1 align="left">Hi 👋, I'm ${profile.fullName || 'Utara Setya'}</h1>\n`;
    md += `<h3 align="left">${profile.title || 'Tech Entrepreneur & Researcher'}</h3>\n\n`;
    md += `<p align="left">${profile.aboutEn || ''}</p>\n\n###\n\n`;

    // --- BAGIAN: STATISTIK BADGE ---
    md += `<p align="left">\n`;
    md += `  <img src="https://img.shields.io/badge/Completed_Projects-${completedProjects}-success?style=for-the-badge" alt="Completed Projects" />\n`;
    md += `  <img src="https://img.shields.io/badge/Ongoing_Projects-${ongoingProjects}-informational?style=for-the-badge" alt="Ongoing Projects" />\n`;
    md += `  <img src="https://img.shields.io/badge/Certificates-${totalCerts}-warning?style=for-the-badge" alt="Certificates" />\n`;
    md += `  <img src="https://img.shields.io/badge/Research-${totalResearch}-blueviolet?style=for-the-badge" alt="Research" />\n`;
    md += `</p>\n\n###\n\n`;

    // --- BAGIAN: SOCIAL LINKS ---
    if (profile.socials && profile.socials.length > 0) {
      md += `<div align="left">\n`;
      profile.socials.forEach(social => {
        const platform = social.platform.toLowerCase();
        let color = "181717"; // default color
        if(platform.includes('linkedin')) color = "0077B5";
        else if(platform.includes('twitter') || platform.includes('x')) color = "1DA1F2";
        else if(platform.includes('instagram')) color = "E4405F";
        else if(platform.includes('upwork')) color = "14A800";
        else if(platform.includes('website') || platform.includes('web')) color = "4285F4";

        md += `  <a href="${social.url}" target="_blank">\n`;
        md += `    <img src="https://img.shields.io/static/v1?message=${social.platform}&logo=${platform}&label=&color=${color}&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="${platform} logo" />\n`;
        md += `  </a>\n`;
      });
      md += `</div>\n\n---\n\n`;
    }

    // --- BAGIAN: EXPERIENCE (Ambil 3 Terbaru) ---
    if (experience.length > 0) {
      md += `<h3 align="left">💼 Experience</h3>\n\n`;
      experience.slice(0, 3).forEach(exp => {
        md += `**${exp.position}** | *${exp.company}* \`(${exp.period})\`\n`;
        if(exp.detailsEn && exp.detailsEn.length > 0){
          exp.detailsEn.slice(0, 2).forEach(detail => {
            md += `- ${detail}\n`;
          });
        }
        md += `\n`;
      });
      md += `---\n\n`;
    }

    // --- BAGIAN: PROJECTS (Ambil 4 Terbaru/Ongoing) ---
    if (projects.length > 0) {
      md += `<h3 align="left">🚀 Featured Projects</h3>\n\n`;
      projects.slice(0, 4).forEach(proj => {
        md += `**${proj.title}** | *${proj.companyName || 'Personal Project'}* \`(${proj.status})\`\n`;
        md += `> ${proj.descriptionEn || proj.descriptionId || ''}\n`;
        if (proj.technologies && proj.technologies.length > 0) {
          md += `- **Tech Stack:** \`${proj.technologies.join('`, `')}\`\n`;
        }
        md += `\n`;
      });
      md += `---\n\n`;
    }

    // --- BAGIAN: EDUCATION ---
    if (education.length > 0) {
      md += `<h3 align="left">🎓 Education</h3>\n\n`;
      education.forEach(edu => {
        md += `**${edu.school}** \`(${edu.period})\`\n`;
        md += `*${edu.degreeEn}* ${edu.gpa ? `*(GPA: ${edu.gpa} / 4.00)*` : ''}\n\n`;
      });
      md += `---\n\n`;
    }

    // --- BAGIAN: CERTIFICATES ---
    if (certs.length > 0) {
      md += `<h3 align="left">🏆 Certificates & Awards</h3>\n\n`;
      certs.slice(0, 8).forEach(cert => {
        md += `- 🥇 **${cert.title}** - *${cert.issuer}*\n`;
      });
      md += `\n---\n\n`;
    }

    // --- BAGIAN: RESEARCH ---
    if (research.length > 0) {
      md += `<h3 align="left">📚 Research & Publications</h3>\n\n`;
      research.forEach(res => {
        md += `**${res.title}** \`(${res.year}, ${res.publisher})\`\n`;
        if (res.tags && res.tags.length > 0) {
          md += `> *#${res.tags.join(' #')}*\n`;
        }
        md += `\n`;
      });
      md += `---\n\n`;
    }

    // --- BAGIAN: SKILLS (Generate Badges Otomatis) ---
    if (skills.length > 0) {
      md += `<h3 align="left">🛠 Tech Stack & Tools</h3>\n\n`;
      skills.forEach(category => {
        md += `**${category.name}**\n<div align="left">\n`;
        if(category.skills && category.skills.length > 0){
           category.skills.forEach(skill => {
             // Menggunakan Shields.io badge text agar dinamis untuk semua skill
             const encodedSkill = encodeURIComponent(skill.name).replace(/-/g, '--');
             md += `  <img src="https://img.shields.io/badge/${encodedSkill}-F3F4F6?style=flat&logoColor=black&labelColor=F3F4F6&color=F3F4F6" alt="${skill.name}" />\n`;
           });
        }
        md += `</div>\n<br>\n\n`;
      });
    }

    // 4. Tulis hasil akhir ke README.md
    fs.writeFileSync('README.md', md);
    console.log('✅ README.md berhasil digenerate ulang 100% dari API setyaw.xyz!');

  } catch (error) {
    console.error('❌ Terjadi error saat generate README:', error);
  }
}

generateReadme();
