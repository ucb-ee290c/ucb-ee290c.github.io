/* Marks the calendar row covering today. The page reads fine without it. */
(function () {
  "use strict";

  var rows = document.querySelectorAll(".calendar tr[data-start]");
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // Every covering row is marked, not just one: two weeks can share a date
  // when the calendar schedules them on the same Friday.
  Array.prototype.forEach.call(rows, function (row) {
    var parts = row.getAttribute("data-start").split("-");
    var start = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var end = new Date(start.getTime());
    end.setDate(end.getDate() + 7);

    if (!(start <= today && today < end)) {
      return;
    }

    row.classList.add("is-current");

    var cell = row.querySelector(".col-week");
    if (cell) {
      var badge = document.createElement("span");
      badge.className = "week-now";
      badge.textContent = "This week";
      cell.appendChild(document.createElement("br"));
      cell.appendChild(badge);
    }
  });
})();
