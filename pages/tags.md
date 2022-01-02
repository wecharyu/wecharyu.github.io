---
title: "Tags"
layout: archive
permalink: /tags
lang: en
---

<link rel="stylesheet" href="/assets/css/tags.css">

<ul class="tag-cloud">
  {% for tag in site.tags %}
    <li>
      <a href="#{{ tag[0] | slugify }}"
      {% if tag[1].size <= 2 %} style="font-size: 0.75em; color: #999;"
      {% elsif tag[1].size <= 5 %} style="font-size: 1em; color: #fff;"
      {% elsif tag[1].size <= 10 %} style="font-size: 1.25em; color: #3f51b5;"
      {% elsif tag[1].size <= 20 %} style="font-size: 1.5em; color: #ff5722;"
      {% elsif tag[1].size <= 50 %} style="font-size: 1.75em; color: #2196f3;"
      {% else %} style="font-size: 2em; color: #f00;"
      {% endif %}
      >
        <strong>{{ tag[0] }}</strong>
      </a>
    </li>
  {% endfor %}
</ul>

<!-- {% assign entries_layout = page.entries_layout | default: 'list' %}
{% for i in (1..tags_max) reversed %}
  {% for tag in site.tags %}
    {% assign l10n_posts = tag[1] | where: "lang", site.active_lang %}
    {% if l10n_posts.size == i %}
      <section id="{{ tag[0] | slugify | downcase }}" class="taxonomy__section">
        <h2 class="archive__subtitle">{{ tag[0] }}</h2>
        <div class="entries-{{ entries_layout }}">
          {% for post in l10n_posts %}
            {% include archive-single.html type=entries_layout %}
          {% endfor %}
        </div>
        <a href="#page-title" class="back-to-top">{{ site.data.ui-text[site.active_lang].back_to_top | default: 'Back to Top' }} &uarr;</a>
      </section>
    {% endif %}
  {% endfor %}
{% endfor %} -->

<ul>
  <li>
    {% for tag in site.tags %}
      <h2 id='{{ tag[0] | slugify }}'>{{tag[0]}}</h2>
      <!-- {% for post in tag[1] %}
        {{post.title}}
      {% endfor %} -->
      <!-- <a href="#archive-title" class="back-to-top">{{ site.data.ui-text[site.active_lang].back_to_top | default: 'Back to Top' }} &uarr;</a> -->
      <a href="#content" class="back-to-top"> 🔝 {{ site.data.ui-text[site.active_lang].back_to_top | default: 'Back to Top' }} &uarr;</a>
    {% endfor %}
  </li>
</ul>
