---
title: "tags_label"
layout: archive
permalink: /tags
---

<link rel="stylesheet" href="/assets/css/paginator.css">
<link rel="stylesheet" href="/assets/css/post-meta.css">

{% assign words = site.tags %}
{% include word-cloud.html %}

<ul>
  {% for tag in site.tags %}
  {% assign tag_in_lang = tag[1] | where: "lang", site.active_lang %}
  {% if tag_in_lang.size > 0 %}
  <li>
    <h2 id='{{ tag[0] | slugify }}' class='archive-subtitle'>{{tag[0]}}</h2>
    {% assign posts = tag[1] | where: "lang", site.active_lang %}
    {% include paginator.html %}
  </li>
  {% endif %}
  {% endfor %}
</ul>
