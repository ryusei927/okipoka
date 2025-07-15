          const section = document.querySelector('.time-based-bg');
          const now = new Date();
          const hour = now.getHours();
          const minute = now.getMinutes();

          if (hour >= 7 && hour < 17) {
            section.style.backgroundImage = "url('/images/asa_si-sa-png')";
          } else if ((hour === 17) || (hour === 18 && minute < 30)) {
            section.style.backgroundImage = "url('/images/yugata_si-sa-.png')";
          } else {
            section.style.backgroundImage = "url('/images/yoru_si-sa-.png')";
          }