/* Course site behavior: marking the current week in the semester calendar.
   The page is fully readable without it. */
(function () {
  "use strict";

  /* Rows carry data-start="YYYY-MM-DD" (the Monday of that week). The row
     whose seven-day span covers today gets marked. Nothing is marked before
     the term begins or after it ends. */

  var rows = document.querySelectorAll(".calendar tr[data-start]");
  if (!rows.length) {
    return;
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var current = null;

  Array.prototype.forEach.call(rows, function (row) {
    var parts = row.getAttribute("data-start").split("-");
    var start = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );
    var end = new Date(start.getTime());
    end.setDate(end.getDate() + 7);

    if (start <= today && today < end) {
      current = row;
    }
  });

  if (current) {
    current.classList.add("is-current");
    // Goes under the week number, whose column is sized to fit this badge.
    var cell = current.querySelector(".col-week");
    if (cell) {
      var badge = document.createElement("span");
      badge.className = "week-now";
      badge.textContent = "This week";
      cell.appendChild(document.createElement("br"));
      cell.appendChild(badge);
    }
  }
})();
