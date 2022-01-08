---
title: "categories_label"
layout: archive
permalink: /categories
---

<link rel="stylesheet" href="/assets/css/paginator.css">
<link rel="stylesheet" href="/assets/css/post-meta.css">

{% assign words = site.categories %}
{% include word-cloud.html %}

<ul>
  {% for category in site.categories %}
  {% assign cat_in_lang = category[1] | where: "lang", site.active_lang %}
  {% if cat_in_lang.size > 0 %}
  <li>
    <h2 id='{{ category[0] | slugify }}' class='archive-subtitle'>{{category[0]}}</h2>
    {% assign posts = category[1] | where: "lang", site.active_lang %}
    {% include paginator.html %}
  </li>
  {% endif %}
  {% endfor %}
</ul>
